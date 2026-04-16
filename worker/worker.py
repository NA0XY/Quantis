import os
import time
import requests
from supabase import create_client, Client
from dotenv import load_dotenv
from sandbox import sandboxed_execute

load_dotenv()

# Universe: Top 50 USDT pairs (simulated subset for MVP)
SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", 
    "XRPUSDT", "ADAUSDT", "DOGEUSDT"
]

def fetch_market_data():
    market_data = {}
    for symbol in SYMBOLS:
        url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval=1m&limit=100"
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            # close price is index 4
            close_prices = [float(candle[4]) for candle in data]
            market_data[symbol] = close_prices
        except Exception as e:
            print(f"Failed to fetch {symbol}: {e}")
    return market_data

def execute_trade(trade, portfolio, supabase: Client, user_id: str):
    symbol = trade["symbol"]
    action = trade["action"]
    amount = trade["amount"]
    price = trade["price"]
    
    if action == "BUY":
        cost_usd = portfolio["usd_balance"] * amount
        if cost_usd < 1.0:
            return # Minimum order
        qty = cost_usd / price
        portfolio["usd_balance"] -= cost_usd
        portfolio["assets"][symbol] = portfolio["assets"].get(symbol, 0) + qty
        
        # Log to db
        supabase.table("trade_history").insert({
            "user_id": user_id,
            "symbol": symbol,
            "action": action,
            "price": price,
            "amount": qty
        }).execute()
        
    elif action == "SELL":
        held = portfolio["assets"].get(symbol, 0)
        if held <= 0:
            return
        qty_to_sell = held * amount
        proceeds = qty_to_sell * price
        
        portfolio["assets"][symbol] -= qty_to_sell
        if portfolio["assets"][symbol] < 1e-8:
            del portfolio["assets"][symbol]
            
        portfolio["usd_balance"] += proceeds
        
        # Log to db
        supabase.table("trade_history").insert({
            "user_id": user_id,
            "symbol": symbol,
            "action": action,
            "price": price,
            "amount": qty_to_sell
        }).execute()

def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Missing SUPABASE config")
        return
        
    supabase: Client = create_client(url, key)
    
    print("Fetching market data...")
    market_data = fetch_market_data()
    if not market_data:
        print("No market data retrieved.")
        return
        
    print("Fetching active algorithms...")
    algos_res = supabase.table("algorithms").select("*").eq("is_active", True).execute()
    algorithms = algos_res.data
    
    for algo in algorithms:
        user_id = algo["user_id"]
        # Fetch user portfolio
        user_res = supabase.table("users").select("portfolio_usd, portfolio_assets").eq("id", user_id).execute()
        if not user_res.data:
            continue
            
        user = user_res.data[0]
        portfolio = {
            "usd_balance": user["portfolio_usd"],
            "assets": user["portfolio_assets"]
        }
        
        pending_trades = []
        for symbol, historical_data in market_data.items():
            result = sandboxed_execute(algo["code"], historical_data, portfolio, symbol)
            
            if result[0] in ("BUY", "SELL"):
                pending_trades.append({
                    "symbol": symbol,
                    "action": result[0],
                    "amount": result[1],
                    "price": historical_data[-1]
                })
                
        for trade in pending_trades:
            execute_trade(trade, portfolio, supabase, user_id)
            
        # Update user portfolio
        supabase.table("users").update({
            "portfolio_usd": portfolio["usd_balance"],
            "portfolio_assets": portfolio["assets"]
        }).eq("id", user_id).execute()
        
        # Update algorithm last_run_at
        supabase.table("algorithms").update({
            "last_run_at": "now()"
        }).eq("id", algo["id"]).execute()
        
    print(f"Processed {len(algorithms)} algorithms.")

if __name__ == "__main__":
    main()

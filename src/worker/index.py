from js import Response, Headers, JSON, fetch, Object
import json

def on_data_wrapper(strategy_code, candles):
    """
    Executes the user's strategy code against a list of candles.
    The user is expected to define a function `on_candle(candle, portfolio)`
    """
    # Initialize simulation environment
    portfolio = {
        "cash": 10000.0,
        "position": 0.0,
        "entry_price": 0.0,
        "trades": [],
        "equity_curve": []
    }
    
    logs = []
    
    # Simple print override to capture user logs
    def custom_print(*args):
        logs.append(" ".join(map(str, args)))

    # Setup the execution context
    exec_globals = {
        "print": custom_print,
        "math": __import__("math"),
    }
    
    try:
        # Compile and execute the user strategy
        exec(strategy_code, exec_globals)
        on_candle = exec_globals.get("on_candle")
        
        if not on_candle:
            raise ValueError("Function 'on_candle(candle, portfolio)' not found in strategy code.")

        # Run the simulation
        for candle in candles:
            # candle is [timestamp, open, high, low, close, volume]
            c_close = float(candle[4])
            
            # Call the user function
            # Portfolio is passed as indexable/mutable for the user
            # We provide a simple API for them to initiate trades
            
            def buy(amount=1.0):
                if portfolio["cash"] > 0:
                    qty = (portfolio["cash"] * amount) / c_close
                    portfolio["position"] += qty
                    portfolio["cash"] -= (qty * c_close)
                    portfolio["trades"].append({
                        "time": candle[0],
                        "action": "BUY",
                        "price": c_close,
                        "qty": qty
                    })

            def sell(amount=1.0):
                if portfolio["position"] > 0:
                    qty = portfolio["position"] * amount
                    portfolio["cash"] += (qty * c_close)
                    portfolio["position"] -= qty
                    portfolio["trades"].append({
                        "time": candle[0],
                        "action": "SELL",
                        "price": c_close,
                        "qty": qty
                    })

            # Decorate portfolio with actions
            portfolio_api = {
                "cash": portfolio["cash"],
                "position": portfolio["position"],
                "buy": buy,
                "sell": sell
            }
            
            on_candle(candle, portfolio_api)
            
            # Sync back (in case they modified values directly)
            portfolio["cash"] = portfolio_api["cash"]
            portfolio["position"] = portfolio_api["position"]
            
            # Record Equity
            total_value = portfolio["cash"] + (portfolio["position"] * c_close)
            portfolio["equity_curve"].append(total_value)

        # Calculate metrics
        equity = portfolio["equity_curve"]
        max_dd = 0
        peak = equity[0]
        for val in equity:
            if val > peak: peak = val
            dd = (peak - val) / peak
            if dd > max_dd: max_dd = dd
        
        # Win stats
        wins = [t for t in portfolio["trades"] if t.get("profit", 0) > 0]
        win_rate = len(wins) / len(portfolio["trades"]) if portfolio["trades"] else 0

        return {
            "success": True,
            "trades": portfolio["trades"],
            "equity": portfolio["equity_curve"],
            "logs": logs,
            "final_value": portfolio["equity_curve"][-1],
            "metrics": {
                "max_drawdown": max_dd,
                "win_rate": win_rate,
                "total_trades": len(portfolio["trades"]),
                "net_profit": portfolio["equity_curve"][-1] - 10000.0
            }
        }

    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "logs": logs
        }

async def fetch_klines(symbol="BTCUSDT", interval="1m", limit=1000):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}"
    resp = await fetch(url)
    return await resp.json()

async def on_fetch(request):
    # Use a list of tuples to avoid "Sequence" type errors in JS bridge
    cors_headers = [
        ["Access-Control-Allow-Origin", "*"],
        ["Access-Control-Allow-Methods", "POST, GET, OPTIONS"],
        ["Access-Control-Allow-Headers", "Content-Type"],
    ]

    if request.method == "OPTIONS":
        return Response.new("", headers=cors_headers)

    try:
        # Convert JS Request to Python
        body_js = await request.json()
        body = json.loads(JSON.stringify(body_js))
        
        strategy_code = body.get("code", "")
        data = body.get("data", [])
        
        if not data:
            data_js = await fetch_klines(
                body.get("symbol", "BTCUSDT"),
                body.get("interval", "1m"),
                body.get("limit", 1000)
            )
            data = json.loads(JSON.stringify(data_js))
        
        # Execute Strategy
        result = on_data_wrapper(strategy_code, data)
        
        # Return response with CORS
        return Response.new(
            json.dumps(result), 
            headers=cors_headers
        )

    except Exception as e:
        import traceback
        error_resp = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        return Response.new(
            json.dumps(error_resp),
            headers=cors_headers
        )

import signal
from RestrictedPython import compile_restricted, safe_globals
from RestrictedPython.Guards import (
    safe_builtins, guarded_iter_unpack_sequence
)

ALLOWED_BUILTINS = {
    k: safe_builtins[k] for k in [
        'abs','all','any','bool','dict','enumerate','filter',
        'float','int','len','list','map','max','min','print',
        'range','round','sorted','str','sum','tuple','zip',
        '__build_class__', '__name__'
    ] if k in safe_builtins
}

RESTRICTED_GLOBALS = {
    '__builtins__': ALLOWED_BUILTINS,
    '_getiter_': iter,
    '_getitem_': lambda ob, idx: ob[idx],
    '_write_': lambda x: x,
    '_inplacevar_': lambda op, x, y: x,
    '_iter_unpack_sequence_': guarded_iter_unpack_sequence,
}

def timeout_handler(signum, frame):
    raise TimeoutError("Algorithm exceeded time limit")

def sandboxed_execute(code: str, historical_data, portfolio, symbol):
    try:
        # Compile with RestrictedPython
        byte_code = compile_restricted(code, '<inline>', 'exec')
        if byte_code is None:
            return ('HOLD', 0)

        local_vars = {}
        exec(byte_code, RESTRICTED_GLOBALS.copy(), local_vars)

        on_data_fn = local_vars.get('on_data')
        if not callable(on_data_fn):
            return ('HOLD', 0)

        # Timeout: kill if takes > 2 seconds
        # Note: signal.alarm only works on Unix!
        try:
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(2)
        except AttributeError:
            # Fallback if running on Windows locally
            pass

        result = on_data_fn(list(historical_data), dict(portfolio), str(symbol))

        try:
            signal.alarm(0)  # cancel alarm
        except AttributeError:
            pass

        # Validate return shape
        if (isinstance(result, tuple) and len(result) == 2
            and result[0] in ('BUY','SELL','HOLD')
            and isinstance(result[1], (int, float))
            and 0.0 <= result[1] <= 1.0):
            return result
        return ('HOLD', 0)

    except Exception as e:
        print(f"Error executing alg: {e}")
        return ('HOLD', 0)

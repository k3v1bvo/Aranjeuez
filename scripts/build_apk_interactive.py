import sys
import pexpect

print("=== INICIANDO CONTROLADOR INTELIGENTE BUBBLEWRAP ===", flush=True)

cmd = (
    "npx --yes @bubblewrap/cli init "
    "--manifest=https://aranjeuez-xi.vercel.app/manifest.json "
    "--directory=./twa-app "
    "--skipPwaValidation"
)

child = pexpect.spawn(cmd, encoding='utf-8', timeout=120)
child.logfile = sys.stdout

while True:
    try:
        idx = child.expect([r'\?', pexpect.EOF, pexpect.TIMEOUT], timeout=35)
        if idx == 0:
            # Obtener UNICAMENTE la ultima linea donde esta la pregunta activa actual
            raw_lines = child.before.strip().split('\n')
            current_prompt = raw_lines[-1].strip().lower() if raw_lines else ""
            print(f"\n[AUTO-REPLY] Pregunta actual: '{current_prompt}'", flush=True)
            
            if 'password' in current_prompt:
                child.sendline('android')
            elif 'key name' in current_prompt or 'alias' in current_prompt:
                child.sendline('android')
            elif 'location' in current_prompt and 'key' in current_prompt:
                child.sendline('./android.keystore')
            elif 'first and last' in current_prompt:
                child.sendline('Paseo Aranjuez')
            elif 'organizational unit' in current_prompt:
                child.sendline('Mobile')
            elif 'organization' in current_prompt:
                child.sendline('Paseo Aranjuez')
            elif 'city' in current_prompt:
                child.sendline('Cochabamba')
            elif 'state' in current_prompt:
                child.sendline('Cochabamba')
            elif 'country' in current_prompt:
                child.sendline('BO')
            elif 'is' in current_prompt and 'correct' in current_prompt:
                child.sendline('yes')
            elif 'version code' in current_prompt:
                child.sendline('1')
            elif 'short name' in current_prompt:
                child.sendline('PsjAranjuez')
            else:
                child.sendline('')
        elif idx == 1:
            print("\n=== BUBBLEWRAP INIT FINALIZO CON EXITO ===", flush=True)
            break
        elif idx == 2:
            print("\n=== TIMEOUT EN PROMPT ===", flush=True)
            break
    except Exception as e:
        print(f"\nError en bucle pexpect: {e}", flush=True)
        break

child.close()
sys.exit(0)

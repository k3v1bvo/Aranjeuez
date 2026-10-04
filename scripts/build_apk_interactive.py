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
            # Obtener las ultimas lineas para analizar la pregunta activa
            raw_text = child.before.strip()
            raw_lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            current_prompt = raw_lines[-1].lower() if raw_lines else ""
            print(f"\n[AUTO-REPLY] Pregunta detectada: '{current_prompt}'", flush=True)
            
            # Prioridad 1: Colores (Status bar, splash, theme color)
            if 'color' in current_prompt or 'status bar' in current_prompt or 'splash' in current_prompt:
                print("-> Enviando color hexadecimal: #061734", flush=True)
                child.sendline('#061734')
            # Prioridad 2: Credenciales de firma y Keystore
            elif 'password' in current_prompt:
                print("-> Enviando password keystore", flush=True)
                child.sendline('android')
            elif 'location' in current_prompt and 'key' in current_prompt:
                print("-> Enviando ruta keystore", flush=True)
                child.sendline('./android.keystore')
            elif 'key name' in current_prompt or 'alias' in current_prompt:
                print("-> Enviando alias key", flush=True)
                child.sendline('android')
            elif 'first and last' in current_prompt:
                child.sendline('Paseo Aranjuez')
            elif 'organizational unit' in current_prompt or 'unit' in current_prompt:
                child.sendline('Mobile')
            elif 'organization' in current_prompt:
                child.sendline('Paseo Aranjuez')
            elif 'city' in current_prompt:
                child.sendline('Cochabamba')
            elif 'state' in current_prompt:
                child.sendline('Cochabamba')
            elif 'country' in current_prompt:
                child.sendline('BO')
            elif 'correct' in current_prompt:
                child.sendline('yes')
            # Prioridad 3: Atributos de PWA/TWA
            elif 'version code' in current_prompt:
                print("-> Enviando version code: 1", flush=True)
                child.sendline('1')
            elif 'short name' in current_prompt:
                print("-> Enviando short name: PsjAranjuez", flush=True)
                child.sendline('PsjAranjuez')
            elif 'display' in current_prompt:
                child.sendline('standalone')
            elif 'orientation' in current_prompt:
                child.sendline('portrait')
            else:
                print("-> Aceptando valor por defecto (Enter)", flush=True)
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

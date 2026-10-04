import sys
import pexpect

print("=== INICIANDO ASISTENTE INTERACTIVO DE BUBBLEWRAP ===", flush=True)

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
            prompt_text = (child.before + child.after).lower()
            if 'password' in prompt_text:
                child.sendline('android')
            elif 'name of the key' in prompt_text or 'key name' in prompt_text:
                child.sendline('android')
            elif 'location' in prompt_text and 'key' in prompt_text:
                child.sendline('./android.keystore')
            elif 'first and last' in prompt_text:
                child.sendline('Paseo Aranjuez')
            elif 'organizational unit' in prompt_text:
                child.sendline('Mobile')
            elif 'organization' in prompt_text:
                child.sendline('Paseo Aranjuez')
            elif 'city' in prompt_text:
                child.sendline('Cochabamba')
            elif 'state' in prompt_text:
                child.sendline('Cochabamba')
            elif 'country' in prompt_text:
                child.sendline('BO')
            elif 'is' in prompt_text and 'correct' in prompt_text:
                child.sendline('yes')
            elif 'short name' in prompt_text:
                child.sendline('PsjAranjuez')
            else:
                child.sendline('')
        elif idx == 1:
            print("\n=== BUBBLEWRAP COMPLETADO SATISFACTORIAMENTE ===", flush=True)
            break
        elif idx == 2:
            print("\n=== TIMEOUT EN PROMPT DE BUBBLEWRAP ===", flush=True)
            break
    except Exception as e:
        print(f"\nFinalizando pexpect: {e}", flush=True)
        break

child.close()
sys.exit(0)

import os
import glob

def refactor_files():
    base_path = 'd:/Quantis/src'
    
    replacements = {
        'AlgoSim': 'Quantis',
        'algosim': 'quantis'
    }

    # Grab all ts, tsx, css files
    extensions = ('*.tsx', '*.ts', '*.css')
    files_to_check = []
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css'):
                files_to_check.append(os.path.join(root, file))
                
    # Also check tailwind config, layout config
    for path in files_to_check:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for k, v in replacements.items():
            new_content = new_content.replace(k, v)
            
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {path}")
            
if __name__ == '__main__':
    refactor_files()

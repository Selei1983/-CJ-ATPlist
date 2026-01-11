import zipfile
import os

def create_package():
    zip_filename = 'amazon-product-exporter-v2.0.zip'
    
    files = [
        'manifest.json',
        'background.js',
        'sidebar.html',
        'sidebar.js',
        'sidebar.css',
        'scripts/content.js',
        'scripts/appwrite.js',
        'assets/icons/icon16.png',
        'assets/icons/icon48.png',
        'assets/icons/icon128.png'
    ]
    
    print(f'Creating {zip_filename}...')
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in files:
            if os.path.exists(file_path):
                zipf.write(file_path)
                print(f'  Added: {file_path}')
            else:
                print(f'  Skipped: {file_path}')
    
    size = os.path.getsize(zip_filename)
    print(f'Created: {size} bytes ({size/1024:.1f} KB)')

if __name__ == '__main__':
    create_package()

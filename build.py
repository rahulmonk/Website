import os
import shutil
import markdown
import frontmatter
from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, 'content')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')
OUTPUT_DIR = os.path.join(BASE_DIR, 'docs')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

# Centralized configuration for site-wide variables and secrets
SITE_CONFIG = {
    "PREFIX": "/Website", # For GitHub Pages subdirectory
    "GOOGLE_FORM_ID": "1FAIpQLScu-rCofPVVChXIY-asiuNfePkW0Io5zn3OcNAjMoQL75wWMA",
    "GOOGLE_APPS_SCRIPT_ID": "AKfycbwpVxn0N9Xvrt7Q80x4J3RvH3nm30wCileY2_EHInXNJzpvIq__nJJ2LCHnW9IaS2Dq"
}

# Configuration-driven content types for easier maintenance
CONTENT_TYPES = [
    {
        "name": "posts",
        "output_dir": "blog",
        "template": "blog_post_template.html",
        "context_key": "post"
    },
    {
        "name": "projects",
        "output_dir": "projects",
        "template": "project_page_template.html",
        "context_key": "project"
    }
]

# --- HELPER FUNCTIONS ---

def get_all_content(content_name, output_dir):
    """Loads all markdown files from a content directory (e.g., 'posts')."""
    all_items = []
    source_dir = os.path.join(CONTENT_DIR, content_name)
    if not os.path.exists(source_dir):
        print(f"Warning: Directory not found, skipping: {source_dir}")
        return []

    for filename in os.listdir(source_dir):
        if filename.endswith('.md'):
            filepath = os.path.join(source_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    post = frontmatter.load(f)
                
                if post.metadata:
                    item_data = post.metadata
                    item_data['content'] = markdown.markdown(post.content)
                    item_data['slug'] = os.path.splitext(filename)[0]
                    item_data['href'] = f"/{output_dir}/{item_data['slug']}.html"
                    
                    if 'date' in item_data:
                        # Ensure date is parsed correctly from YAML (which can be a date object)
                        item_data['date_obj'] = datetime.strptime(str(item_data['date']), '%Y-%m-%d')
                    else:
                        item_data['date_obj'] = datetime.now()
                    all_items.append(item_data)
                else:
                    print(f"[ERROR] Could not read metadata from '{filename}'. Is it formatted correctly with '---' separators?")
            except Exception as e:
                print(f"[FATAL ERROR] Failed to process file '{filename}': {e}")
            
    all_items.sort(key=lambda x: x['date_obj'], reverse=True)
    return all_items

def generate_pages(items, config, env):
    """Generates individual HTML pages for each content item based on the config."""
    template = env.get_template(config['template'])
    output_path = os.path.join(OUTPUT_DIR, config['output_dir'])
    os.makedirs(output_path, exist_ok=True)
    
    for item in items:
        # The context now includes the specific item and the global site config
        context = {
            config['context_key']: item, 
            "SITE_CONFIG": SITE_CONFIG
        }
        output_file_path = os.path.join(output_path, f"{item['slug']}.html")
        
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(template.render(context))
        print(f"-> Generated {output_file_path}")

# --- MAIN BUILD SCRIPT ---

def main():
    """The main function to build the static site."""
    print("Starting build process...")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    print(f"✓ Cleaned and created output directory: {OUTPUT_DIR}")

    if os.path.exists(ASSETS_DIR):
        shutil.copytree(ASSETS_DIR, os.path.join(OUTPUT_DIR, 'assets'))
        print("✓ Copied static assets")

    # Load all content types by iterating through the configuration
    content_data = {}
    for content_type in CONTENT_TYPES:
        content_name = content_type["name"]
        content_data[content_name] = get_all_content(content_name, content_type["output_dir"])
        print(f"✓ Loaded {len(content_data[content_name])} {content_name}")
    
    # Halt build if no content was loaded at all
    if not any(content_data.values()):
        print("WARNING: No content loaded. Check for errors above. Halting build.")
        with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w') as f:
            f.write('<h1>Build Failed: No content found. Check terminal for errors.</h1>')
        return

    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=select_autoescape(['html', 'xml']))

    # Generate pages for each content type by iterating through the configuration
    for content_type in CONTENT_TYPES:
        name = content_type["name"]
        if content_data[name]:
            generate_pages(content_data[name], content_type, env)

    # Render the main index page
    index_template = env.get_template('index_template.html')
    index_context = {
        "posts": content_data.get("posts", []),
        "projects": content_data.get("projects", []),
        "SITE_CONFIG": SITE_CONFIG
    }
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_template.render(index_context))
    print(f"-> Generated {os.path.join(OUTPUT_DIR, 'index.html')}")
    
    print("\nBuild process complete!")

if __name__ == '__main__':
    main()
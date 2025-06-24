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
# ** THE FIX IS HERE: Define your repository name **
# This will be added to the start of all links.
# Leave it blank "" if you are using a custom domain.
SITE_PREFIX = "/Website" 

# --- HELPER FUNCTIONS ---

def get_all_content(content_type):
    all_items = []
    source_dir = os.path.join(CONTENT_DIR, content_type)
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
                    html_content = markdown.markdown(post.content)
                    item_data = post.metadata
                    item_data['content'] = html_content
                    item_data['slug'] = os.path.splitext(filename)[0]
                    
                    output_folder = 'blog' if content_type == 'posts' else 'projects'
                    # Prepend the site prefix to create the correct final URL
                    item_data['href'] = f"{SITE_PREFIX}/{output_folder}/{item_data['slug']}.html"
                    
                    if 'date' in item_data:
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

def generate_pages(items, content_type_plural, template_name, env):
    template = env.get_template(template_name)
    output_folder_name = 'blog' if content_type_plural == 'posts' else 'projects'
    output_path = os.path.join(OUTPUT_DIR, output_folder_name)
    os.makedirs(output_path, exist_ok=True)
    
    context_key = content_type_plural.rstrip('s')
    
    for item in items:
        # Pass the SITE_PREFIX to the template context
        context = {context_key: item, "SITE_PREFIX": SITE_PREFIX}
        output_file_path = os.path.join(output_path, f"{item['slug']}.html")
        
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(template.render(context))
        print(f"-> Generated {output_file_path}")

# --- MAIN BUILD SCRIPT ---

def main():
    print("Starting build process...")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    print(f"✓ Cleaned and created output directory: {OUTPUT_DIR}")

    if os.path.exists(ASSETS_DIR):
        shutil.copytree(ASSETS_DIR, os.path.join(OUTPUT_DIR, 'assets'))
        print("✓ Copied static assets")

    posts = get_all_content('posts')
    projects = get_all_content('projects')
    print(f"✓ Loaded {len(posts)} posts and {len(projects)} projects")

    if not posts and not projects:
        print("WARNING: No content loaded. Check for errors above. Halting build.")
        # Create a basic index page so the site doesn't 404
        with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w') as f:
            f.write('<h1>Build Failed: No content found.</h1>')
        return

    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(['html', 'xml'])
    )

    if posts:
        generate_pages(posts, 'posts', 'blog_post_template.html', env)
    if projects:
        generate_pages(projects, 'projects', 'project_page_template.html', env)

    index_template = env.get_template('index_template.html')
    # Pass SITE_PREFIX to the index page as well
    index_html = index_template.render(posts=posts, projects=projects, SITE_PREFIX=SITE_PREFIX)
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_html)
    print(f"-> Generated {os.path.join(OUTPUT_DIR, 'index.html')}")
    
    print("\nBuild process complete!")

if __name__ == '__main__':
    main()

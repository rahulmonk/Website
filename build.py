import os
import shutil
import markdown
import frontmatter
from jinja2 import Environment, FileSystemLoader
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, '_content')
TEMPLATES_DIR = os.path.join(BASE_DIR, '_templates')
OUTPUT_DIR = os.path.join(BASE_DIR, 'docs')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

# --- HELPER FUNCTIONS ---

def get_all_content(content_type):
    """
    Loads all markdown files from a specific content directory (e.g., 'posts' or 'projects').
    """
    all_items = []
    source_dir = os.path.join(CONTENT_DIR, content_type)
    if not os.path.exists(source_dir):
        return []

    for filename in os.listdir(source_dir):
        if filename.endswith('.md'):
            # Load metadata and markdown content
            post = frontmatter.load(os.path.join(source_dir, filename))
            
            # Convert markdown content to HTML
            html_content = markdown.markdown(post.content)
            
            # Store everything in a dictionary
            item_data = post.metadata
            item_data['content'] = html_content
            # Create a URL-friendly slug from the filename
            item_data['slug'] = os.path.splitext(filename)[0]
            
            # Convert date string to datetime object for sorting
            if 'date' in item_data:
                item_data['date_obj'] = datetime.strptime(item_data['date'], '%Y-%m-%d')
                
            all_items.append(item_data)
            
    # Sort items by date, newest first
    if all_items and 'date_obj' in all_items[0]:
        all_items.sort(key=lambda x: x['date_obj'], reverse=True)
        
    return all_items

def generate_pages(items, content_type, template_name, env):
    """
    Generates individual HTML pages for each content item.
    """
    template = env.get_template(template_name)
    output_path = os.path.join(OUTPUT_DIR, content_type)
    os.makedirs(output_path, exist_ok=True)
    
    for item in items:
        output_file_path = os.path.join(output_path, f"{item['slug']}.html")
        with open(output_file_path, 'w', encoding='utf-8') as f:
            # The context passed to the template has a key 'post' or 'project'
            context = {content_type[:-1]: item}
            f.write(template.render(context))
        print(f"-> Generated {output_file_path}")

# --- MAIN BUILD SCRIPT ---

def main():
    """
    The main function to build the static site.
    """
    print("Starting build process...")

    # 1. Clean and recreate the output directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    print(f"✓ Cleaned and created output directory: {OUTPUT_DIR}")

    # 2. Copy static assets
    shutil.copytree(ASSETS_DIR, os.path.join(OUTPUT_DIR, 'assets'))
    print("✓ Copied static assets")

    # 3. Load content
    posts = get_all_content('posts')
    projects = get_all_content('projects')
    print(f"✓ Loaded {len(posts)} posts and {len(projects)} projects")

    # 4. Set up Jinja2 templating environment
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

    # 5. Generate individual blog and project pages
    if posts:
        generate_pages(posts, 'blog', 'blog_post_template.html', env)
    if projects:
        generate_pages(projects, 'projects', 'project_page_template.html', env)

    # 6. Generate the index.html page
    index_template = env.get_template('index_template.html')
    index_html = index_template.render(posts=posts, projects=projects)
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_html)
    print(f"-> Generated {os.path.join(OUTPUT_DIR, 'index.html')}")
    
    print("\nBuild process complete!")


if __name__ == '__main__':
    main()

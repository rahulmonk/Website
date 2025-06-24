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

# --- HELPER FUNCTIONS ---

def get_all_content(content_type):
    """
    Loads all markdown files from a specific content directory (e.g., 'posts' or 'projects').
    """
    all_items = []
    source_dir = os.path.join(CONTENT_DIR, content_type)
    if not os.path.exists(source_dir):
        print(f"Warning: Directory not found, skipping: {source_dir}")
        return []

    for filename in os.listdir(source_dir):
        if filename.endswith('.md'):
            try:
                post = frontmatter.load(os.path.join(source_dir, filename))
                html_content = markdown.markdown(post.content)
                
                item_data = post.metadata
                item_data['content'] = html_content
                item_data['slug'] = os.path.splitext(filename)[0]
                
                # Create the correct root-relative URL for the final site
                item_data['href'] = f"/{content_type.rstrip('s')}/{item_data['slug']}.html"
                
                if 'date' in item_data:
                    item_data['date_obj'] = datetime.strptime(item_data['date'], '%Y-%m-%d')
                else:
                    item_data['date_obj'] = datetime.now()

                all_items.append(item_data)
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
            
    all_items.sort(key=lambda x: x['date_obj'], reverse=True)
    return all_items

def generate_pages(items, content_type, template_name, env):
    """
    Generates individual HTML pages for each content item.
    """
    template = env.get_template(template_name)
    output_path = os.path.join(OUTPUT_DIR, content_type.rstrip('s'))
    os.makedirs(output_path, exist_ok=True)
    
    for item in items:
        context_key = content_type.rstrip('s')
        context = {context_key: item}
        output_file_path = os.path.join(output_path, f"{item['slug']}.html")
        
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(template.render(context))
        print(f"-> Generated {output_file_path}")

# --- MAIN BUILD SCRIPT ---

def main():
    """
    The main function to build the static site.
    """
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

    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(['html', 'xml'])
    )

    if posts:
        generate_pages(posts, 'blog', 'blog_post_template.html', env)
    if projects:
        generate_pages(projects, 'projects', 'project_page_template.html', env)

    index_template = env.get_template('index_template.html')
    index_html = index_template.render(posts=posts, projects=projects)
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_html)
    print(f"-> Generated {os.path.join(OUTPUT_DIR, 'index.html')}")
    
    print("\nBuild process complete!")

if __name__ == '__main__':
    main()

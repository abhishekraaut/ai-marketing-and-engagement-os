import os

def print_tree(startpath, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = set()
    tree_str = ""
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        level = root.replace(startpath, '').count(os.sep)
        indent = '│   ' * (level - 1) + '├── ' if level > 0 else ''
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = '│   ' * level + '├── '
        for f in files:
            tree_str += f"{subindent}{f}\n"
    return tree_str

if __name__ == "__main__":
    t = print_tree(".", exclude_dirs={".git", "node_modules", ".next", "venv", "__pycache__"})
    with open("tree_output.txt", "w", encoding="utf-8") as f:
        f.write(t)

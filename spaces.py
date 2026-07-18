import os
import sys

# Check if running inside Hugging Face Spaces environment
if "SPACE_ID" in os.environ:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Temporarily remove local directory from sys.path to import system 'spaces' package
    original_path = list(sys.path)
    try:
        sys.path = [p for p in sys.path if p not in (current_dir, "")]
        import spaces as real_spaces
        GPU = real_spaces.GPU
    except ImportError:
        def GPU(f):
            return f
    finally:
        sys.path = original_path
else:
    def GPU(f):
        return f

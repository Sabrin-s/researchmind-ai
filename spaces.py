import os
import sys

# Check if running inside Hugging Face Spaces environment
if "SPACE_ID" in os.environ:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    original_path = list(sys.path)
    
    # Save reference to this wrapper module
    wrapper_module = sys.modules.get("spaces")
    
    try:
        # Temporarily remove local directory from sys.path
        sys.path = [p for p in sys.path if p not in (current_dir, "")]
        
        # Temporarily pop 'spaces' from sys.modules to force system-level re-import
        if "spaces" in sys.modules:
            sys.modules.pop("spaces")
            
        import spaces as real_spaces
        GPU = real_spaces.GPU
    except ImportError:
        def GPU(f):
            return f
    finally:
        # Restore sys.path
        sys.path = original_path
        # Restore this wrapper module back into sys.modules
        if wrapper_module:
            sys.modules["spaces"] = wrapper_module
else:
    def GPU(f):
        return f

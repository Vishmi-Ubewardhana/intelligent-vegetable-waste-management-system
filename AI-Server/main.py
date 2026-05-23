"""Backward-compatible entrypoint for local runs.

The real app lives in app/main.py so Docker and Uvicorn can import it
as a package, but `python main.py` still works for development.
"""

from app.main import app


if __name__ == "__main__":
    import subprocess

    subprocess.run(["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"], check=False)

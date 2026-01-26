import path from "path";

export const QWEN_DEFAULT = {
    SPEAKER: 'Ryan',
    LANGUAGE: 'Russian',
    PYTHON_SERVER_HOST:'127.0.0.1',
    PYTHON_SERVER_PORT:'9009'
}

export const CONDA_BAT_PATH = path.join('C:', 'Users', 'justa', 'miniconda3', 'condabin', 'conda.bat');
export const CONDA_ENV_NAME = "qwen3-tts";
export const PY_SERVER_SCRIPT_PATH = path.join(__dirname, '..', '..', '..', 'static', 'qwen-tts-server.py');

echo "Starting MAIN-Service"
uvicorn main:app --host "$BACKEND_FASTAPI_HOSTS" --port "$MAIN_FASTAPI_PORTS" --reload


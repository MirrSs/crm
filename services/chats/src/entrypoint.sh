#!/usr/bin/env bash

alembic upgrade head || true
uvicorn main:app --host 0.0.0.0 --port 8100 --reload



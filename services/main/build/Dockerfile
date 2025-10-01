FROM python:3.11

RUN pip3 install pipenv

WORKDIR /usr/src/app/

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update \
    && apt-get -y install libpq-dev gcc

COPY ./services/main/Pipfile ./services/main/Pipfile.lock ./

COPY ./services/main/src .

EXPOSE 8000

RUN pipenv install --system --deploy --dev
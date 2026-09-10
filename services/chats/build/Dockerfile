FROM python:3.11

RUN pip3 install pipenv

WORKDIR /usr/src/app/

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update \
    && apt-get -y install libpq-dev gcc

COPY ./services/chats/Pipfile ./services/chats/Pipfile.lock ./

COPY ./services/chats/src .

EXPOSE 8100

RUN pipenv install --system --deploy --dev



# Migrations

This directory is managed by **Flask-Migrate** (Alembic).

## Initialise (first time only)

```bash
flask db init        # creates this directory structure
flask db migrate -m "initial schema"
flask db upgrade
```

## Adding new migrations after model changes

```bash
flask db migrate -m "describe change"
flask db upgrade
```

Do **not** manually edit files inside `versions/` — let Alembic generate them.

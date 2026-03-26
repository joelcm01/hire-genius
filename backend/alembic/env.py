import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Alembic Config object — gives access to values in alembic.ini
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Override sqlalchemy.url with the DATABASE_URL environment variable so that
# the same alembic.ini works both locally and inside Docker containers.
# ---------------------------------------------------------------------------
database_url = os.environ.get("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# ---------------------------------------------------------------------------
# Import the project's metadata so Alembic can detect model changes for
# autogenerate support.  All model modules must be imported here.
# ---------------------------------------------------------------------------
# Add the backend directory to sys.path so that `app.*` imports resolve.
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base  # noqa: E402  — imports Base with all models registered

# Import every model module so that their tables are registered on Base.metadata
# before autogenerate runs.
import app.models.candidate  # noqa: F401
import app.models.vacancy    # noqa: F401
import app.models.evaluation # noqa: F401
import app.models.contact    # noqa: F401
import app.models.feedback   # noqa: F401
import app.models.status     # noqa: F401
import app.models.gdrive     # noqa: F401

target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Other Alembic options (can be overridden from alembic.ini)
# ---------------------------------------------------------------------------


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an actual DBAPI
    connection.  By skipping the connection we don't even need a DBAPI to be
    available.  Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

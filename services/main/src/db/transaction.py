from loguru import logger
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

@asynccontextmanager
async def transaction(session: AsyncSession):
    """
    Async context manager to handle database transactions in SQLAlchemy.
    Commits the transaction if no exceptions occur; otherwise, rolls back.
    
    :param session: AsyncSession object from SQLAlchemy
    """
    try:
        yield  # control is given to the code block inside the context manager
        await session.commit()  # Commit transaction if no exceptions
    except Exception as e:
        # Rollback transaction if any exceptions occur
        await session.rollback()
        # Log the exception
        logger.error(f"Transaction failed, rolled back due to: {str(e)}")
        raise  # Re-raise the exception to allow further handling
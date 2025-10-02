"""add discounts to deals and deal items

Revision ID: b7f3a2c9d5e1
Revises: 8a1dd2d3148c
Create Date: 2025-10-02 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7f3a2c9d5e1'
down_revision: Union[str, None] = '8a1dd2d3148c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # add discount columns to line items
    op.add_column('deal_products', sa.Column('discount_type', sa.String(length=16), nullable=True))
    op.add_column('deal_products', sa.Column('discount_value', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('deal_services', sa.Column('discount_type', sa.String(length=16), nullable=True))
    op.add_column('deal_services', sa.Column('discount_value', sa.Numeric(precision=12, scale=2), nullable=True))
    # add order-level discount to deals
    op.add_column('deals', sa.Column('discount_type', sa.String(length=16), nullable=True))
    op.add_column('deals', sa.Column('discount_value', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('deals', 'discount_value')
    op.drop_column('deals', 'discount_type')
    op.drop_column('deal_services', 'discount_value')
    op.drop_column('deal_services', 'discount_type')
    op.drop_column('deal_products', 'discount_value')
    op.drop_column('deal_products', 'discount_type')



"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('api_key', sa.String(255), nullable=False, unique=True),
        sa.Column('role', sa.Enum('admin', 'member', name='userrole'), nullable=False),
        sa.Column('credits', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_users_api_key', 'users', ['api_key'])

    # Create rules table
    op.create_table(
        'rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('pattern', sa.Text(), nullable=False),
        sa.Column('action', sa.Enum('AUTO_ACCEPT', 'AUTO_REJECT', 'REQUIRE_APPROVAL', name='ruleaction'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_rules_priority', 'rules', ['priority'])

    # Create commands table
    op.create_table(
        'commands',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('command_text', sa.Text(), nullable=False),
        sa.Column('matched_rule_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action_taken', sa.Enum('ACCEPTED', 'REJECTED', 'PENDING', name='actiontaken'), nullable=False),
        sa.Column('cost', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('executed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['matched_rule_id'], ['rules.id']),
    )
    op.create_index('ix_commands_user_id', 'commands', ['user_id'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.String(255), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id']),
    )
    op.create_index('ix_audit_logs_actor_user_id', 'audit_logs', ['actor_user_id'])
    op.create_index('ix_audit_logs_event_type', 'audit_logs', ['event_type'])
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_audit_logs_created_at', table_name='audit_logs')
    op.drop_index('ix_audit_logs_event_type', table_name='audit_logs')
    op.drop_index('ix_audit_logs_actor_user_id', table_name='audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index('ix_commands_user_id', table_name='commands')
    op.drop_table('commands')
    
    op.drop_index('ix_rules_priority', table_name='rules')
    op.drop_table('rules')
    
    op.drop_index('ix_users_api_key', table_name='users')
    op.drop_table('users')


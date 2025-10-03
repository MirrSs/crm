from __future__ import annotations

from typing import Any, Dict, List, Optional
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from models.history_model import History


def _normalize_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        try:
            return float(value)
        except Exception:
            return str(value)
    if hasattr(value, "isoformat"):
        try:
            return value.isoformat()
        except Exception:
            return str(value)
    return value


def model_to_plain_dict(model: Any) -> Dict[str, Any]:
    if model is None:
        return {}
    result: Dict[str, Any] = {}
    try:
        columns = getattr(model, "__table__").columns  # type: ignore[attr-defined]
        for col in columns:
            name = col.name
            result[name] = getattr(model, name, None)
    except Exception:
        # Fallback: avoid including SQLAlchemy internals
        for key, val in getattr(model, "__dict__", {}).items():
            if key.startswith("_"):
                continue
            result[key] = val
    return result


def build_changes_diff(before: Dict[str, Any] | None, after: Dict[str, Any] | None, include_keys: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    changes: List[Dict[str, Any]] = []
    before = before or {}
    after = after or {}

    keys = set(include_keys or set(before.keys()) | set(after.keys()))
    ignored = {"id", "created_at", "updated_at"}
    for key in sorted(keys):
        if key in ignored:
            continue
        old_val = _normalize_value(before.get(key))
        new_val = _normalize_value(after.get(key))
        if old_val != new_val:
            changes.append({"field": key, "old": old_val, "new": new_val})
    return changes


class HistoryService:
    @staticmethod
    async def log(
        session: AsyncSession,
        *,
        entity_type: str,
        entity_id: int,
        action: str,
        account_id: Optional[int] = None,
        user_id: Optional[int] = None,
        changes: Optional[List[Dict[str, Any]]] = None,
        meta: Optional[Dict[str, Any]] = None,
    ) -> History:
        record = History(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            account_id=account_id,
            user_id=user_id,
            changes=changes or [],
            meta=meta or {},
        )
        session.add(record)
        await session.flush()
        await session.refresh(record)
        return record



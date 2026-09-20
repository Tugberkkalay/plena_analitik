"""Integrity gate for synthetic tenant datasets.

Seed data is treated like production input: the complete bundle is validated before
the existing tenant dataset is replaced.
"""
from collections import Counter
import hashlib
import json


class SeedValidationError(ValueError):
    pass


def _stable_checksum(bundle):
    payload = json.dumps(bundle, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def validate_seed_bundle(bundle, *, sector, expected_headcount, departments):
    errors = []
    employees = bundle["employees"]
    branches = bundle["branches"]
    sales = bundle["sales"]
    training = bundle["training"]
    engagement = bundle["engagement"]
    norm = bundle["norm_kadro"]

    if len(employees) != expected_headcount:
        errors.append(f"employee count {len(employees)} != expected {expected_headcount}")

    employee_ids = [item.get("id") for item in employees]
    if None in employee_ids or len(employee_ids) != len(set(employee_ids)):
        errors.append("employee ids must be present and unique")

    employee_by_id = {item["id"]: item for item in employees if item.get("id")}
    allowed_departments = set(departments)
    for employee in employees:
        if employee.get("department") not in allowed_departments:
            errors.append(f"unknown employee department: {employee.get('department')}")
        hire_date = employee.get("hire_date")
        termination_date = employee.get("termination_date")
        if not hire_date:
            errors.append(f"employee {employee.get('id')} has no hire date")
        if termination_date and hire_date and termination_date <= hire_date:
            errors.append(f"employee {employee.get('id')} terminates before hire")
        if employee.get("status") == "active" and termination_date:
            errors.append(f"active employee {employee.get('id')} has termination date")
        if employee.get("status") == "terminated" and not termination_date:
            errors.append(f"terminated employee {employee.get('id')} has no termination date")

    if sector != "Bankacılık" and (branches or sales):
        errors.append(f"{sector} seed must not contain banking branch/sales records")

    branch_ids = {item.get("id") for item in branches}
    for row in sales:
        if row.get("employee_id") not in employee_by_id:
            errors.append("sales record references unknown employee")
        if row.get("branch_id") not in branch_ids:
            errors.append("sales record references unknown branch")

    active_ids = {item["id"] for item in employees if item.get("status") == "active"}
    for collection_name, rows in (("training", training), ("engagement", engagement)):
        for row in rows:
            if row.get("employee_id") not in active_ids:
                errors.append(f"{collection_name} record references non-active employee")
    engagement_counts = Counter(row.get("employee_id") for row in engagement)
    if active_ids and (set(engagement_counts) != active_ids or any(v != 1 for v in engagement_counts.values())):
        errors.append("engagement must contain exactly one record per active employee")

    department_norm = {
        (row.get("department"), row.get("donem")): row
        for row in norm if not row.get("position")
    }
    for month in range(1, 13):
        period = f"2025-{month:02d}"
        period_end = f"{period}-31"
        for department in departments:
            expected_actual = sum(
                1 for employee in employees
                if employee.get("department") == department
                and employee.get("hire_date", "9999-99-99") <= period_end
                and (not employee.get("termination_date") or employee["termination_date"] > period_end)
            )
            row = department_norm.get((department, period))
            if not row or row.get("gerceklesen_kadro") != expected_actual:
                errors.append(f"norm headcount mismatch for {department} {period}")

    for name, rows in bundle.items():
        ids = [row.get("id") for row in rows if "id" in row]
        if len(ids) != len(set(ids)):
            errors.append(f"duplicate ids in {name}")

    if errors:
        unique_errors = list(dict.fromkeys(errors))
        raise SeedValidationError("; ".join(unique_errors[:20]))

    return {
        "version": "2025.1",
        "sector": sector,
        "counts": {name: len(rows) for name, rows in bundle.items()},
        "checksum": _stable_checksum(bundle),
    }

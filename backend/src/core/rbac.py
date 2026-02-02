from uuid import UUID

ROLES_CACHE_TTL_SECONDS = 900 # 15 minutes

def roles_cache_key(user_id: UUID | str, version: int) -> str:
    return f"auth:roles:{user_id}:v{version}"
 
GLOBAL_ROLE_IMPLICATIONS = {
    "admin": {"member"},
    "member": set(),
}

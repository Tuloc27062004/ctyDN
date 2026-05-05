import os
import time
import random
import socket
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor

# =========================================================
# CONFIG
# =========================================================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "",
)

ADMIN_EMAIL = "nguyenngoctrongtin@gmail.com"
ADMIN_PASSWORD = "nguyenngoctrongtin123@"

# Change these if you want
ADMIN_FULL_NAME = "Admin"
ADMIN_PHONE = "0000000000"
ADMIN_COUNTRY = "Vietnam"
ADMIN_COMPANY_NAME = "Admin"
ADMIN_COMPANY_ADDRESS = "Vietnam"

# =========================================================
# CUID GENERATOR
# Prisma's cuid() is usually generated client-side, so when
# inserting from raw SQL we generate one here.
# =========================================================
_counter = random.randint(0, 36**4 - 1)
_BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def base36(num: int) -> str:
    if num == 0:
        return "0"
    out = []
    while num:
        num, rem = divmod(num, 36)
        out.append(_BASE36[rem])
    return "".join(reversed(out))


def generate_cuid() -> str:
    global _counter
    _counter = (_counter + 1) % (36**4)

    ts = base36(int(time.time() * 1000)).rjust(8, "0")[-8:]
    cnt = base36(_counter).rjust(4, "0")
    pid = base36(os.getpid() % (36**2)).rjust(2, "0")
    host = base36(sum(ord(c) for c in socket.gethostname()) % (36**2)).rjust(2, "0")
    rand1 = "".join(random.choice(_BASE36) for _ in range(4))
    rand2 = "".join(random.choice(_BASE36) for _ in range(4))

    # Typical cuid shape: c + timestamp + counter + fingerprint + random + random
    return f"c{ts}{cnt}{pid}{host}{rand1}{rand2}"


# =========================================================
# PASSWORD HASH
# Most Prisma / Next / Nest auth setups use bcrypt.
# If your app uses argon2 instead, replace this function.
# =========================================================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


# =========================================================
# SEED LOGIC
# - If email does not exist: create admin user
# - If email exists: upgrade it to ADMIN and refresh password
# =========================================================
def seed_admin():
    hashed_password = hash_password(ADMIN_PASSWORD)

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if user already exists
            cur.execute(
                '''
                SELECT id, email, role, status, "isActive"
                FROM "User"
                WHERE email = %s
                ''',
                (ADMIN_EMAIL,),
            )
            existing_user = cur.fetchone()

            if existing_user:
                cur.execute(
                    '''
                    UPDATE "User"
                    SET
                        "fullName" = %s,
                        "phone" = %s,
                        "country" = %s,
                        "companyName" = %s,
                        "companyAddress" = %s,
                        "password" = %s,
                        "role" = CAST(%s AS "Role"),
                        "status" = CAST(%s AS "UserStatus"),
                        "isActive" = %s,
                        "verifyToken" = NULL,
                        "verifyTokenExp" = NULL,
                        "updatedAt" = NOW()
                    WHERE email = %s
                    RETURNING id, email, role, status, "isActive"
                    ''',
                    (
                        ADMIN_FULL_NAME,
                        ADMIN_PHONE,
                        ADMIN_COUNTRY,
                        ADMIN_COMPANY_NAME,
                        ADMIN_COMPANY_ADDRESS,
                        hashed_password,
                        "ADMIN",
                        "VERIFIED",
                        True,
                        ADMIN_EMAIL,
                    ),
                )
                user = cur.fetchone()
                conn.commit()

                print("Existing user found. Updated to admin successfully.")
                print(f"ID       : {user['id']}")
                print(f"Email    : {user['email']}")
                print(f"Role     : {user['role']}")
                print(f"Status   : {user['status']}")
                print(f"Is Active: {user['isActive']}")

            else:
                new_id = generate_cuid()

                cur.execute(
                    '''
                    INSERT INTO "User" (
                        id,
                        "fullName",
                        email,
                        phone,
                        country,
                        "companyName",
                        "companyAddress",
                        password,
                        role,
                        status,
                        "isActive",
                        "verifyToken",
                        "verifyTokenExp",
                        "createdAt",
                        "updatedAt"
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        CAST(%s AS "Role"),
                        CAST(%s AS "UserStatus"),
                        %s,
                        NULL,
                        NULL,
                        NOW(),
                        NOW()
                    )
                    RETURNING id, email, role, status, "isActive"
                    ''',
                    (
                        new_id,
                        ADMIN_FULL_NAME,
                        ADMIN_EMAIL,
                        ADMIN_PHONE,
                        ADMIN_COUNTRY,
                        ADMIN_COMPANY_NAME,
                        ADMIN_COMPANY_ADDRESS,
                        hashed_password,
                        "ADMIN",
                        "VERIFIED",
                        True,
                    ),
                )
                user = cur.fetchone()
                conn.commit()

                print("Admin user created successfully.")
                print(f"ID       : {user['id']}")
                print(f"Email    : {user['email']}")
                print(f"Role     : {user['role']}")
                print(f"Status   : {user['status']}")
                print(f"Is Active: {user['isActive']}")

    except Exception as e:
        conn.rollback()
        print("Failed to seed admin user.")
        print("Error:", str(e))
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed_admin()

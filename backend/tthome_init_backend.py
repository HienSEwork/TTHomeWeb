#!/usr/bin/env python3
"""
Sinh monorepo backend TTHome (Maven, Spring Boot) bằng Spring Initializr.

Chạy:   python tthome_init_backend.py [--out ./tthome] [--java 21] [--boot 3.5.7] [--only listing-service,crm-service]

Kết quả:
  <out>/backend/pom.xml                 parent pom (modules, dependencyManagement, annotation processor)
  <out>/backend/mvnw, .mvn/             Maven Wrapper, một bản dùng chung
  <out>/backend/tthome-common/          thư viện dùng chung (không chạy độc lập)
  <out>/backend/tthome-events/          hợp đồng sự kiện RabbitMQ
  <out>/backend/services/<name>/        11 service, khung thư mục theo mục 4.1 của kế hoạch

Yêu cầu: Python 3.8+, kết nối internet tới https://start.spring.io. Không cần cài thêm gói nào.
Script chạy lại được: thư mục đã có sẽ bị bỏ qua (dùng --force để ghi đè).
"""
import argparse
import io
import os
import re
import shutil
import stat
import sys
import time
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

INITIALIZR = os.environ.get("INITIALIZR_URL", "https://start.spring.io/starter.zip")
GROUP = "vn.tthome"
ROOT_ARTIFACT = "tthome-backend"
ROOT_VERSION = "1.0.0-SNAPSHOT"

# Phiên bản thư viện ngoài Spring Boot BOM. Kiểm tra lại bản mới nhất trước khi dùng thật.
MAPSTRUCT_VERSION = "1.6.3"
LOMBOK_MAPSTRUCT_BINDING_VERSION = "0.2.0"

BASE_DEPS = ["web", "validation", "data-jpa", "postgresql", "flyway", "rabbitmq",
             "actuator", "lombok", "testcontainers"]


def with_deps(add=(), remove=()):
    return [d for d in BASE_DEPS if d not in remove] + list(add)


# artifactId, package con, schema PostgreSQL, port, dependencies trên Initializr
SERVICES = [
    ("identity-service",     "identity",    "identity",    8081, with_deps(add=["security"])),
    ("meey-sync-service",    "meeysync",    "sync",        8082, with_deps()),
    ("listing-service",      "listing",     "inventory",   8083, with_deps()),
    ("search-service",       "search",      "search",      8084, with_deps(add=["jdbc"], remove=["data-jpa"])),
    ("media-service",        "media",       "media",       8085, with_deps()),
    ("crm-service",          "crm",         "crm",         8086, with_deps()),
    ("booking-service",      "booking",     "booking",     8087, with_deps()),
    ("consignment-service",  "consignment", "consignment", 8088, with_deps()),
    ("cms-service",          "cms",         "cms",         8089, with_deps()),
    ("notification-service", "notification", "notify",     8090, with_deps()),
    ("report-service",       "report",      "report",      8091, with_deps()),
]

LIBS = [
    # artifactId, package con, dependencies (starter đều để optional)
    ("tthome-common", "common", ["web", "validation", "data-jpa", "rabbitmq", "lombok"]),
    ("tthome-events", "events", []),
]

SERVICE_DIRS = [
    "config", "controllers", "services", "repos",
    "models/entities", "models/dtos", "models/enums", "models/mappers",
    "messaging/publishers", "messaging/listeners",
    "clients", "jobs", "commons",
]
TEST_DIRS = ["controllers", "services", "repos"]
COMMON_DIRS = ["web", "error", "security", "persistence", "outbox", "messaging", "client", "observability"]
EVENT_DIRS = ["identity", "listing", "meey", "crm", "booking", "consignment", "cms", "media"]

# Việc cần làm tay sau khi sinh (thư viện không có trên Initializr hoặc cần chọn version)
MANUAL_NOTES = {
    "identity-service": "Argon2 (de.mkammerer:argon2-jvm), JWT (io.jsonwebtoken:jjwt-*)",
    "media-service": "Cloudinary SDK (com.cloudinary:cloudinary-http5)",
    "report-service": "Apache POI (org.apache.poi:poi-ooxml)",
    "*": "Resilience4j khi service gọi service khác qua clients/",
}


# ---------------------------------------------------------------- tiện ích
def fetch(params, retries=3):
    url = INITIALIZR + "?" + urllib.parse.urlencode(params)
    err = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "tthome-init/1.0"})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(2 * (i + 1))
    sys.exit(f"Không tải được từ Initializr ({err}).\nURL: {url}")


def unzip_strip(data, dest):
    """Giải nén, bỏ thư mục gốc đầu tiên trong zip."""
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for info in z.infolist():
            parts = Path(info.filename).parts[1:]
            if not parts:
                continue
            target = dest.joinpath(*parts)
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(z.read(info))


def request_params(artifact, package, deps, java, boot):
    p = {
        "type": "maven-project", "language": "java", "packaging": "jar",
        "groupId": GROUP, "artifactId": artifact, "name": artifact,
        "description": f"TTHome - {artifact}",
        "packageName": f"{GROUP}.{package}", "javaVersion": java,
        "baseDir": artifact,
    }
    if deps:
        p["dependencies"] = ",".join(deps)
    if boot:
        p["bootVersion"] = boot
    return p


def parent_version(pom):
    m = re.search(r"<parent>.*?<version>([^<]+)</version>.*?</parent>", pom, re.S)
    if not m:
        sys.exit("Không đọc được version Spring Boot trong pom Initializr trả về.")
    return m.group(1).strip()


def make_exec(path):
    path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def touch_keep(path):
    path.mkdir(parents=True, exist_ok=True)
    (path / ".gitkeep").write_text("")


# ---------------------------------------------------------------- xử lý pom
PARENT_XML = (
    "<parent>\n"
    "\t\t<groupId>%s</groupId>\n"
    "\t\t<artifactId>%s</artifactId>\n"
    "\t\t<version>%s</version>\n"
    "\t\t<relativePath>%%s</relativePath>\n"
    "\t</parent>" % (GROUP, ROOT_ARTIFACT, ROOT_VERSION)
)


def rewrite_pom(text, rel_parent):
    """Thay parent của Initializr bằng parent pom của TTHome, bỏ version riêng."""
    text = re.sub(r"<parent>.*?</parent>", lambda _m: PARENT_XML % rel_parent, text, count=1, flags=re.S)
    text = re.sub(
        r"(</parent>\s*<groupId>[^<]+</groupId>\s*<artifactId>[^<]+</artifactId>)\s*<version>[^<]*</version>",
        r"\1", text, count=1)
    return text


def add_dependencies(text, xml):
    return text.replace("\t</dependencies>", xml + "\t</dependencies>", 1)


SERVICE_EXTRA_DEPS = """\t\t<dependency>
\t\t\t<groupId>%(g)s</groupId>
\t\t\t<artifactId>tthome-common</artifactId>
\t\t</dependency>
\t\t<dependency>
\t\t\t<groupId>%(g)s</groupId>
\t\t\t<artifactId>tthome-events</artifactId>
\t\t</dependency>
\t\t<dependency>
\t\t\t<groupId>org.mapstruct</groupId>
\t\t\t<artifactId>mapstruct</artifactId>
\t\t</dependency>
""" % {"g": GROUP}


def make_library(text):
    """Biến project Initializr thành thư viện: bỏ plugin đóng gói chạy được, đánh dấu starter là optional."""
    text = re.sub(r"\s*<build>.*?</build>", "", text, count=1, flags=re.S)

    def mark(m):
        block = m.group(0)
        if "<scope>test</scope>" in block or "<optional>" in block:
            return block
        return block.replace("</dependency>", "\t<optional>true</optional>\n\t\t</dependency>")

    head, sep, tail = text.partition("<dependencies>")
    deps, sep2, rest = tail.partition("</dependencies>")
    deps = re.sub(r"<dependency>.*?</dependency>", mark, deps, flags=re.S)
    return head + sep + deps + sep2 + rest


# ---------------------------------------------------------------- file mẫu
def application_yml(name, schema, port):
    return f"""server:
  port: {port}

# Database = Supabase PostgreSQL (không dùng DB local). Chuỗi kết nối lấy ở Dashboard > Connect > JDBC.
# Mỗi service nên dùng role riêng: {schema}_svc.<PROJECT-REF> (xem db/supabase_roles.sql).
spring:
  application:
    name: {name}
  profiles:
    default: dev                              # chạy local không cần đặt gì; production đặt SPRING_PROFILES_ACTIVE=prod
  datasource:
    # Session pooler (cổng 5432, hỗ trợ IPv4 + prepared statement). Không dùng transaction pooler 6543 cho JPA.
    url: ${{SUPABASE_DB_URL}}              # jdbc:postgresql://<POOLER-HOST>:5432/postgres?sslmode=require
    username: ${{DB_USER:{schema}_svc.${{SUPABASE_PROJECT_REF}}}}
    password: ${{DB_PASSWORD}}
    hikari:
      maximum-pool-size: ${{DB_POOL_MAX:3}}   # 11 service x pool: giữ tổng dưới giới hạn kết nối của gói Supabase
      minimum-idle: 1
      # KHÔNG đặt hikari.schema: Hikari chạy SET search_path theo phiên, không an toàn qua pooler
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: {schema}              # Hibernate tự ghi tên schema vào SQL nên không cần search_path
  flyway:
    schemas: {schema}
    default-schema: {schema}
    # Schema nền (db/tthome_schema.sql) đã chạy tay trên Supabase = V1. Migration của service bắt đầu từ V2.
    baseline-on-migrate: true
    baseline-version: 1
    # Migrate nên chạy bằng kết nối direct/session: đặt FLYWAY_URL riêng nếu cần
    url: ${{FLYWAY_URL:${{SUPABASE_DB_URL}}}}
  rabbitmq:
    host: ${{RABBIT_HOST:localhost}}
    port: 5672
    username: ${{RABBIT_USER:guest}}
    password: ${{RABBIT_PASSWORD:guest}}

management:
  endpoints:
    web:
      exposure:
        include: health,info
"""


APPLICATION_DEV_YML = """# Profile dev (mặc định): chưa dùng RabbitMQ nên tắt auto-config, service khởi động được khi chưa có broker.
# Bật lại khi bắt đầu viết messaging: xóa khối exclude này (hoặc chạy với profile khác) và cài RabbitMQ.
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.amqp.autoconfigure.RabbitAutoConfiguration
"""


ENV_EXAMPLE = """# Sao chép thành .env (KHÔNG commit). Lấy giá trị ở Supabase Dashboard > Connect.
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_URL=jdbc:postgresql://aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
# Mật khẩu của từng role service (xem db/supabase_roles.sql); có thể dùng chung khi chạy thử
DB_PASSWORD=change-me
RABBIT_HOST=rabbitmq
RABBIT_USER=tthome
RABBIT_PASSWORD=change-me
"""


SUPABASE_ROLES_SQL = """-- Chạy trong Supabase SQL Editor SAU KHI nạp tthome_schema.sql.
-- Mỗi service một role, chỉ có quyền trên schema của nó. Đổi mật khẩu trước khi chạy.
-- Kết nối qua pooler: username = <role>.<PROJECT-REF>
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('identity_svc','identity'),('inventory_svc','inventory'),('search_svc','search'),
    ('crm_svc','crm'),('booking_svc','booking'),('consignment_svc','consignment'),
    ('cms_svc','cms'),('notify_svc','notify'),('media_svc','media'),
    ('sync_svc','sync'),('report_svc','report')) AS t(role_name, sch)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.role_name) THEN
      EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', r.role_name, 'CHANGE_ME_' || r.role_name);
    END IF;
    EXECUTE format('GRANT USAGE, CREATE ON SCHEMA %I TO %I', r.sch, r.role_name);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO %I', r.sch, r.role_name);
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO %I', r.sch, r.role_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO %I', r.sch, r.role_name);
    -- dùng chung hàm tiện ích và extension
    EXECUTE format('GRANT USAGE ON SCHEMA common, public, extensions TO %I', r.role_name);
    -- khóa quyền truy cập qua Data API (PostgREST)
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM anon, authenticated', r.sch);
  END LOOP;
END $$;
-- Lưu ý: tên service trong code là "listing-service" nhưng schema là "inventory" => role inventory_svc.
-- Việc cần làm tay: ALTER ROLE ... PASSWORD '...' cho từng role; không expose các schema này ở Settings > Data API.
"""


def root_pom(boot_version, modules):
    mods = "\n".join(f"\t\t<module>{m}</module>" for m in modules)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
\t\t xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
\t<modelVersion>4.0.0</modelVersion>

\t<parent>
\t\t<groupId>org.springframework.boot</groupId>
\t\t<artifactId>spring-boot-starter-parent</artifactId>
\t\t<version>{boot_version}</version>
\t\t<relativePath/>
\t</parent>

\t<groupId>{GROUP}</groupId>
\t<artifactId>{ROOT_ARTIFACT}</artifactId>
\t<version>{ROOT_VERSION}</version>
\t<packaging>pom</packaging>
\t<name>{ROOT_ARTIFACT}</name>

\t<modules>
{mods}
\t</modules>

\t<properties>
\t\t<mapstruct.version>{MAPSTRUCT_VERSION}</mapstruct.version>
\t\t<lombok-mapstruct-binding.version>{LOMBOK_MAPSTRUCT_BINDING_VERSION}</lombok-mapstruct-binding.version>
\t</properties>

\t<dependencyManagement>
\t\t<dependencies>
\t\t\t<dependency>
\t\t\t\t<groupId>{GROUP}</groupId>
\t\t\t\t<artifactId>tthome-common</artifactId>
\t\t\t\t<version>${{project.version}}</version>
\t\t\t</dependency>
\t\t\t<dependency>
\t\t\t\t<groupId>{GROUP}</groupId>
\t\t\t\t<artifactId>tthome-events</artifactId>
\t\t\t\t<version>${{project.version}}</version>
\t\t\t</dependency>
\t\t\t<dependency>
\t\t\t\t<groupId>org.mapstruct</groupId>
\t\t\t\t<artifactId>mapstruct</artifactId>
\t\t\t\t<version>${{mapstruct.version}}</version>
\t\t\t</dependency>
\t\t</dependencies>
\t</dependencyManagement>

\t<build>
\t\t<plugins>
\t\t\t<!-- Lombok + MapStruct dùng chung cho mọi module (bắt buộc đúng thứ tự processor) -->
\t\t\t<plugin>
\t\t\t\t<groupId>org.apache.maven.plugins</groupId>
\t\t\t\t<artifactId>maven-compiler-plugin</artifactId>
\t\t\t\t<configuration>
\t\t\t\t\t<annotationProcessorPaths>
\t\t\t\t\t\t<path>
\t\t\t\t\t\t\t<groupId>org.projectlombok</groupId>
\t\t\t\t\t\t\t<artifactId>lombok</artifactId>
\t\t\t\t\t\t\t<version>${{lombok.version}}</version>
\t\t\t\t\t\t</path>
\t\t\t\t\t\t<path>
\t\t\t\t\t\t\t<groupId>org.projectlombok</groupId>
\t\t\t\t\t\t\t<artifactId>lombok-mapstruct-binding</artifactId>
\t\t\t\t\t\t\t<version>${{lombok-mapstruct-binding.version}}</version>
\t\t\t\t\t\t</path>
\t\t\t\t\t\t<path>
\t\t\t\t\t\t\t<groupId>org.mapstruct</groupId>
\t\t\t\t\t\t\t<artifactId>mapstruct-processor</artifactId>
\t\t\t\t\t\t\t<version>${{mapstruct.version}}</version>
\t\t\t\t\t\t</path>
\t\t\t\t\t</annotationProcessorPaths>
\t\t\t\t</configuration>
\t\t\t</plugin>
\t\t</plugins>
\t</build>
</project>
"""


GITIGNORE = """target/
.idea/
*.iml
.vscode/
.env
HELP.md
*.log
"""

README = """# TTHome backend (Maven)

Sinh bởi tthome_init_backend.py từ Spring Initializr.

## Build
    ./mvnw clean verify                                          # toàn bộ
    ./mvnw -pl services/listing-service -am package              # một service + module nó phụ thuộc
    ./mvnw -pl services/listing-service spring-boot:run          # chạy một service

## Cần có trước khi chạy service (database = Supabase)
1. Chạy `db/tthome_schema.sql` trong Supabase SQL Editor, rồi `db/supabase_roles.sql` (đổi mật khẩu role).
2. Sao chép `infra/docker/.env.example` thành `.env`, điền SUPABASE_PROJECT_REF, SUPABASE_DB_URL, DB_PASSWORD.
3. Dùng **session pooler (cổng 5432)** cho service; transaction pooler (6543) không hỗ trợ prepared statement nên không hợp với JPA.
4. RabbitMQ (mặc định localhost:5672). Không có container Postgres trong Docker Compose.
5. JPA để `ddl-auto: validate`: thiếu bảng thì app dừng ngay khi khởi động.
6. Migration Flyway của từng service bắt đầu từ V2 (schema nền là V1).

## Việc còn lại phải làm tay (không có trên Initializr)
{notes}

## Ghi chú
- Port: identity 8081, meey-sync 8082, listing 8083, search 8084, media 8085, crm 8086,
  booking 8087, consignment 8088, cms 8089, notification 8090, report 8091.
- tthome-common và tthome-events là thư viện: starter trong tthome-common để optional,
  mỗi service tự khai starter nó cần (Initializr đã khai sẵn).
- Phiên bản MapStruct và lombok-mapstruct-binding đặt trong backend/pom.xml; kiểm tra bản mới nhất.
"""


# ---------------------------------------------------------------- chính
def main():
    ap = argparse.ArgumentParser(description="Sinh monorepo backend TTHome (Maven)")
    ap.add_argument("--out", default="./tthome", help="thư mục gốc dự án (mặc định ./tthome)")
    ap.add_argument("--java", default="21")
    ap.add_argument("--boot", default="", help="version Spring Boot; bỏ trống = bản ổn định mới nhất của Initializr")
    ap.add_argument("--only", default="", help="chỉ sinh các service này, cách nhau dấu phẩy")
    ap.add_argument("--force", action="store_true", help="ghi đè thư mục đã tồn tại")
    args = ap.parse_args()

    out = Path(args.out).resolve()
    backend = out / "backend"
    only = {s.strip() for s in args.only.split(",") if s.strip()}
    services = [s for s in SERVICES if not only or s[0] in only]
    if only and len(services) != len(only):
        sys.exit("Tên service không hợp lệ: " + ", ".join(sorted(only - {s[0] for s in SERVICES})))
    backend.mkdir(parents=True, exist_ok=True)

    # 1) Sinh project đầu tiên để biết Initializr đang dùng Spring Boot nào, rồi khóa version đó cho tất cả
    first = LIBS[0]
    boot = args.boot
    first_zip = fetch(request_params(first[0], first[1], first[2], args.java, boot))
    probe = zipfile.ZipFile(io.BytesIO(first_zip))
    pom_name = next(n for n in probe.namelist() if n.endswith("/pom.xml") and n.count("/") == 1)
    boot = boot or parent_version(probe.read(pom_name).decode("utf-8"))
    print(f"Spring Boot {boot}, Java {args.java}")

    # 2) Thư viện dùng chung
    for artifact, pkg, deps in LIBS:
        dest = backend / artifact
        if dest.exists() and not args.force:
            print(f"  bỏ qua {artifact} (đã có)")
            continue
        if dest.exists():
            shutil.rmtree(dest)
        data = first_zip if artifact == first[0] else fetch(request_params(artifact, pkg, deps, args.java, boot))
        if artifact == first[0] and not (backend / "mvnw").exists():
            with zipfile.ZipFile(io.BytesIO(data)) as z:        # lấy Maven Wrapper cho thư mục gốc
                for info in z.infolist():
                    parts = Path(info.filename).parts[1:]
                    if parts and parts[0] in ("mvnw", "mvnw.cmd", ".mvn") and not info.is_dir():
                        t = backend.joinpath(*parts)
                        t.parent.mkdir(parents=True, exist_ok=True)
                        t.write_bytes(z.read(info))
            make_exec(backend / "mvnw")
        unzip_strip(data, dest)
        pom = rewrite_pom((dest / "pom.xml").read_text(encoding="utf-8"), "../pom.xml")
        (dest / "pom.xml").write_text(make_library(pom), encoding="utf-8")
        for junk in ("mvnw", "mvnw.cmd", ".mvn", ".gitignore", "HELP.md", "src/test", "src/main/resources"):
            p = dest / junk
            shutil.rmtree(p) if p.is_dir() else p.unlink(missing_ok=True)
        for f in (dest / "src/main/java").rglob("*Application.java"):
            f.unlink()
        base = dest / "src/main/java" / Path(*GROUP.split(".")) / pkg
        for d in (COMMON_DIRS if pkg == "common" else EVENT_DIRS):
            touch_keep(base / d)
        print(f"  ok  {artifact}")

    # 3) Service
    for artifact, pkg, schema, port, deps in services:
        dest = backend / "services" / artifact
        if dest.exists() and not args.force:
            print(f"  bỏ qua {artifact} (đã có)")
            continue
        if dest.exists():
            shutil.rmtree(dest)
        unzip_strip(fetch(request_params(artifact, pkg, deps, args.java, boot)), dest)
        pom = rewrite_pom((dest / "pom.xml").read_text(encoding="utf-8"), "../../pom.xml")
        (dest / "pom.xml").write_text(add_dependencies(pom, SERVICE_EXTRA_DEPS), encoding="utf-8")
        for junk in ("mvnw", "mvnw.cmd", ".mvn", ".gitignore", "HELP.md"):
            p = dest / junk
            shutil.rmtree(p) if p.is_dir() else p.unlink(missing_ok=True)
        res = dest / "src/main/resources"
        res.mkdir(parents=True, exist_ok=True)
        (res / "application.properties").unlink(missing_ok=True)
        (res / "application.yml").write_text(application_yml(artifact, schema, port), encoding="utf-8")
        (res / "application-dev.yml").write_text(APPLICATION_DEV_YML, encoding="utf-8")
        touch_keep(res / "db/migration")
        base = dest / "src/main/java" / Path(*GROUP.split(".")) / pkg
        for d in SERVICE_DIRS:
            touch_keep(base / d)
        tbase = dest / "src/test/java" / Path(*GROUP.split(".")) / pkg
        for d in TEST_DIRS:
            touch_keep(tbase / d)
        print(f"  ok  {artifact}  (port {port}, schema {schema})")

    # 4) Parent pom, README, gitignore
    modules = [a for a, _, _ in LIBS] + [f"services/{s[0]}" for s in SERVICES]
    (backend / "pom.xml").write_text(root_pom(boot, modules), encoding="utf-8")
    (backend / ".gitignore").write_text(GITIGNORE, encoding="utf-8")
    notes = "\n".join(f"- {k}: {v}" for k, v in MANUAL_NOTES.items())
    (backend / "README.md").write_text(README.format(notes=notes), encoding="utf-8")

    # 5) Thư mục còn lại theo mục 4.1
    for d in ("frontend", "infra/docker", "infra/nginx/conf.d", "infra/rabbitmq",               "db", ".github/workflows"):
        touch_keep(out / d)
    (out / "infra/docker/.env.example").write_text(ENV_EXAMPLE, encoding="utf-8")
    (out / "db/supabase_roles.sql").write_text(SUPABASE_ROLES_SQL, encoding="utf-8")
    here = Path(__file__).resolve().parent
    for f in ("tthome_schema.sql", "tthome.dbml"):        # nếu để cạnh script thì chép vào db/
        if (here / f).exists():
            shutil.copy(here / f, out / "db" / f)

    print(f"\nXong: {out}\nBước tiếp theo:  cd {backend} && ./mvnw -q -DskipTests package")


if __name__ == "__main__":
    main()

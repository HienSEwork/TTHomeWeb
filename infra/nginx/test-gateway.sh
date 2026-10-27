#!/usr/bin/env bash
# Starts the gateway in front of a stub that echoes the headers it receives, then checks the routing and, above all,
# that a client-supplied X-Forwarded-For never reaches the service. Needs Docker; run by CI (job "Gateway").
set -euo pipefail

cd "$(dirname "$0")"
net="tthome-gw-test-$$"
port="${GATEWAY_TEST_PORT:-18080}"

cleanup() {
    docker rm -f "gw-echo-$$" "gw-listing-$$" "gw-media-$$" "gw-cms-$$" "gw-booking-$$" "gw-crm-$$" "gw-consignment-$$" "gw-nginx-$$" >/dev/null 2>&1 || true
    docker network rm "$net" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create "$net" >/dev/null

docker run -d --name "gw-echo-$$" --network "$net" --network-alias identity-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        body = "".join(f"{k}: {v}\n" for k, v in self.headers.items()).encode()
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    do_POST = do_PUT = do_GET
HTTPServer(("", 8081), H).serve_forever()
' >/dev/null

docker run -d --name "gw-listing-$$" --network "$net" --network-alias listing-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "7")
        self.end_headers()
        self.wfile.write(b"listing")
    do_POST = do_PUT = do_DELETE = do_GET
HTTPServer(("", 8083), H).serve_forever()
' >/dev/null

docker run -d --name "gw-media-$$" --network "$net" --network-alias media-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "5")
        self.end_headers()
        self.wfile.write(b"media")
    do_POST = do_PUT = do_DELETE = do_GET
HTTPServer(("", 8085), H).serve_forever()
' >/dev/null

docker run -d --name "gw-cms-$$" --network "$net" --network-alias cms-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "3")
        self.end_headers()
        self.wfile.write(b"cms")
    do_POST = do_PUT = do_DELETE = do_GET
HTTPServer(("", 8089), H).serve_forever()
' >/dev/null

docker run -d --name "gw-booking-$$" --network "$net" --network-alias booking-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "7")
        self.end_headers()
        self.wfile.write(b"booking")
    do_POST = do_PUT = do_DELETE = do_GET
HTTPServer(("", 8087), H).serve_forever()
' >/dev/null

docker run -d --name "gw-crm-$$" --network "$net" --network-alias crm-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "3")
        self.end_headers()
        self.wfile.write(b"crm")
    do_POST = do_PUT = do_DELETE = do_GET
HTTPServer(("", 8086), H).serve_forever()
' >/dev/null

docker run -d --name "gw-consignment-$$" --network "$net" --network-alias consignment-service python:3.12-alpine python -c '
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Length", "11")
        self.end_headers()
        self.wfile.write(b"consignment")
    do_POST = do_PUT = do_DELETE = do_GET
HTTPServer(("", 8088), H).serve_forever()
' >/dev/null

docker run -d --name "gw-nginx-$$" --network "$net" -p "$port:80" -v "$PWD/conf.d:/etc/nginx/conf.d:ro" \
    nginx:1.27-alpine >/dev/null

for _ in $(seq 1 30); do
    curl -fs "http://localhost:$port/healthz" >/dev/null 2>&1 && break
    sleep 1
done

fail() { echo "FAIL: $1" >&2; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

[ "$(status "http://localhost:$port/healthz")" = 200 ] || fail "/healthz is not 200"
[ "$(status "http://localhost:$port/api/v1/auth/me")" = 200 ] || fail "/api/v1/auth is not proxied"
[ "$(status -X PUT "http://localhost:$port/api/v1/admin/users/x/roles")" = 200 ] || fail "/api/v1/admin is not proxied"
[ "$(curl -s "http://localhost:$port/api/v1/admin/catalog/areas")" = listing ] || fail "/api/v1/admin/catalog is not proxied to listing-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/projects")" = listing ] || fail "/api/v1/admin/projects is not proxied to listing-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/rooms/x/media")" = listing ] || fail "/api/v1/admin/rooms is not proxied to listing-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/media/assets")" = media ] || fail "/api/v1/admin/media is not proxied to media-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/cms/banners")" = cms ] || fail "/api/v1/admin/cms is not proxied to cms-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/booking/appointments")" = booking ] || fail "/api/v1/admin/booking is not proxied to booking-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/crm/customers")" = crm ] || fail "/api/v1/admin/crm is not proxied to crm-service"
[ "$(curl -s "http://localhost:$port/api/v1/admin/consignment/submissions")" = consignment ] || fail "/api/v1/admin/consignment is not proxied to consignment-service"
[ "$(status "http://localhost:$port/actuator/health")" = 404 ] || fail "/actuator must not be exposed"
[ "$(status "http://localhost:$port/")" = 404 ] || fail "unknown paths must be 404"

seen="$(curl -s -H 'X-Forwarded-For: 6.6.6.6, 7.7.7.7' -H 'X-Real-IP: 8.8.8.8' -H 'Authorization: Bearer abc' \
    "http://localhost:$port/api/v1/auth/me")"
echo "$seen" | grep -qi '^X-Forwarded-For:' || fail "X-Forwarded-For is not forwarded"
echo "$seen" | grep -i '^X-Forwarded-For:' | grep -q '6\.6\.6\.6\|7\.7\.7\.7\|,' && fail "client X-Forwarded-For leaked"
echo "$seen" | grep -i '^X-Real-IP:' | grep -q '8\.8\.8\.8' && fail "client X-Real-IP leaked"
echo "$seen" | grep -qi '^Authorization: Bearer abc' || fail "Authorization is not forwarded"

echo "gateway checks passed"

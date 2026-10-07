# API examples

## Health

```bash
curl http://localhost:5000/health
```

## Create user

```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Honey Andharia\",\"email\":\"honey@example.com\"}"
```

## List users

```bash
curl "http://localhost:5000/api/v1/users?page=1&limit=10"
```

## Search users

```bash
curl "http://localhost:5000/api/v1/users?search=honey"
```

## Get user

```bash
curl http://localhost:5000/api/v1/users/1
```

## Update user

```bash
curl -X PATCH http://localhost:5000/api/v1/users/1 \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Updated Name\"}"
```

## Delete user

```bash
curl -X DELETE http://localhost:5000/api/v1/users/1
```

## Burrow API

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Count transactions

```
http://localhost:3000/api/transactions/count/account.near
```

Output:

```JSON
{
  "count": 1234
}
```

### List transactions

```
http://localhost:3000/api/transactions/account.near
```

Optional parameters:

```
http://localhost:3000/api/transactions/thankyouser.near?limit=3&offset=0
```

Output:

```JSON
[
  {
    "block_timestamp": "1661976362981090829",
    "receipt_id": "25ZLqJFdzoLmS2z16vyFnAC1LXxFLWmDZcgZSTR6tU5q",
    "status": "SUCCESS",
    "event": {
      "event": "repay",
      "data": [
        {
          "account_id": "thankyouser.near",
          "amount": "27353874074849452841",
          "token_id": "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near"
        }
      ]
    }
  },
  {
    "block_timestamp": "1661976357278500499",
    "receipt_id": "9WKwqCUgFXptfhd6PGokYaYVfCS1L1DsDuBjvT48pAxy",
    "status": "SUCCESS",
    "event": {
      "event": "deposit",
      "data": [
        {
          "account_id": "thankyouser.near",
          "amount": "27353873584136855096",
          "token_id": "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near"
        }
      ]
    }
  },
  {
    "block_timestamp": "1661976315116575206",
    "receipt_id": "4PJpML1taQ6rymAn1rXksQHz2xXEheCxAgG1GSdQU4vx",
    "status": "SUCCESS",
    "event": {
      "event": "withdraw_succeeded",
      "data": [
        {
          "account_id": "thankyouser.near",
          "amount": "283452591261908519592090",
          "token_id": "wrap.near"
        }
      ]
    }
  }
]

```

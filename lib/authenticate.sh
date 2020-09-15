#!/bin/bash

# you need an access token to make a request. the access token expires in 30 minutes.
# to get an access token, you need a refresh token. the refresh token expires in 90 days.
# to get a refresh token, you need an authorization code. 

# *** GET A REFRESH TOKEN***
# you receive the authorization code by logging in with the following URI. first, set up a listener

nc -l 443

# you already set the parameters when you registered your application. they are:

REDIRECT_URI="https%3A%2F%2F127.0.0.1"    
CLIENT_ID="NUNBJMU9XQMDAANFOT6G4MQA1I85EG7P"

curl https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=$REDIRECT_URI&client_id=$CLIENT_ID%40AMER.OAUTHAP

# after logging in granting permission to your app, you will be redirected to an error page. URL decode the "code" parameter in the redirect URL
# it will be something like this:

CODE="HoanIF7lwFM3C6zisEvbxsYosiEafnFSpey%2B9R992AJr2z4ttxWkBTjSrPV2aV%2B9sZiyjyr6C7DdETbXRfuSsILNotMcpyIOZqg%2FYNtSlekQrPI9O0UL3Q7IOkfzQMTdThDmWSsGaSL1bLJCkSu9xJJ516CWZapz5Loaspc80ULGl50H1XGs8xLLTaWAT1KOPOuAJuenzvNCU9WEi28amZZxv4bBbWZzXhsWulffy6t3oELSejC%2FoGBp4LJtrlTXldxj8UgP5qR%2BMFuB%2FDraBcGeCAzfc8lVKbzWc420CsIaNiB1NsW8pJlU58lf6aENj9OQLnT0sVv7RN0qS9mdgrn%2FQr0V9kEGW7pQqyssAWBkL2geiphX2B8jEY7DpilltryaNHsOHHPLpKdZLYF4pELXsqb4uuiaPdKp6%2BHkuw0TCqyJivghbbUALdp100MQuG4LYrgoVi%2FJHHvljFBWf0A%2F7ROePhfNX%2F6UhZQYkdfKSnzinmlgtAViSx1ioFLfwjfny8YxEKhjGwVdOocgljt52RLYfuILpKXmCJUFmEu9CGUaXec5fCYKqxU0sziInv4OjTpwfqcCCa53YFfjX4DXntAB1AUq2rGvww9Ma1K528br8cGonH5WFetbV0qRyix%2F5fAVYEp06%2BqDbl5gnR7eIaukVOnOMYbNQGV6zljVnNu3KdNqV040WcLtQ0hoLXPevjkMmWG9jVjAojPS51OXP8DOtjv5ym3Ja8UxgjNu4mT2TcZJbz9lSaOM0ehA1138vGlXJLLuOTsAANnMgk2eHx6LDwLe11Z17I5ea6IMMkcYJ1um%2F5ZXqjNbG9%2BL%2BZJLxioK22uvojHp4Pl3ZJ6oAlBqyicmgFyguKbhln19c%2FukPZ9Jz6IP3zIDA2emxUc5tjGr6wI%3D212FD3x19z9sWBHDJACbC00B75E"

curl -X POST --header "Content-Type: application/x-www-form-urlencoded" -d "grant_type=authorization_code&refresh_token=&access_type=offline&code=$CODE&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI" "https://api.tdameritrade.com/v1/oauth2/token"

# this command will return new refresh and access tokens.

# *** GET A NEW ACCESS TOKEN ***

# if you don't have a refresh token, follow the steps above. if you do, it will look like this:
REFRESH_TOKEN="FuNukK2RKxVk7UcST1Su%2FAl%2BIioJN67wJqGLpTVhqRVClx%2B%2F0x4TxPeWtOTXEexqyXtKkes1CXMGoMoosY5HidqMxQcMdloAan%2BFEKEFYTMOMO6jj4vhFuc5pu3SnwIqajARayMJZhyigybpaCLhTAZbvwCeBpszS9%2FoOKW5PGrCvgOhnp26X18z3P%2BCv8zrIV%2B5TblwYDKunCXiqu8%2FmCGuHUJv%2BRrSv7x4qAz30vfhI4JesRs%2BNsf3Xu8sZV2gyqxazk75jXapGigM4JRsnaWVrMcPMQYq2l4o8ZYaq0YQbUxgTFJp4bAVTHFSgB3li87YN37zV78IfFxDlvYOjV0EA84VM2I9SdHCp8%2B2LlGogPZ2s%2BopWuK2SgTnheBp0pQl8fOOZqeVrXqDEQ9D8VZJvBElpsQ7JAbIOxxNOv%2FQkrQs%2F7u%2Ft5oYs35100MQuG4LYrgoVi%2FJHHvldLOCTLPJoTTtYho%2FBb0thwAWinbaxSKJ%2BFpCFQmyhQu6rN3A9s2jNxOgY%2F7nMFyz0Z00LjmtlEBj3Mo8sLJ503bIf68ptb7O35xeZAcCovdDD0iJ7K%2BH4A%2FBIFEpmlGIL89UmblC%2BKh1gKImsdUMFt6F9hjVzlH8M66QhhBQ4pmzrbV3iB807dfkeZneY7Blz1fq10tFonASL%2FcgAY1%2BSYgr6CzPv24oSgc7Zw2KaXHFe3eNGpXqmgex3VLopmCymxpzknPLnRD9mOZrR7Tv543ecMR9icOSvTxQHWU8bJ1BuUlIgFFQtA07a%2BCHds8IYx5yJQXAZN7NqAIpyfI5llFhKOvKUJdlKlwIkVCP1D0H0vYgI%2F5fmGGvFESi9nAFnz78xBVf%2F%2BXQkTkguIfklHpVjpus0DRijMiXCuOjtrSXgn30evinMwe%2BUNE%3D212FD3x19z9sWBHDJACbC00B75E"

# now, request a new access token:
curl -X POST --header "Content-Type: application/x-www-form-urlencoded" -d "grant_type=refresh_token&refresh_token=$REFRESH_TOKEN&access_type=&code=&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI" "https://api.tdameritrade.com/v1/oauth2/token"

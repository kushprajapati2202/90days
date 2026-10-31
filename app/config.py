import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://kushprajapati2202_db_user:VnImiBqq9umjV6Vasd@cluster0.wcna3yz.mongodb.net/?retryWrites=true&w=majority"
)
DATABASE_NAME = os.getenv("DATABASE_NAME", "workout90_db")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")


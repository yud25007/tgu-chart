FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    OPEN_BROWSER=0 \
    DATA_DIR=/app/data \
    OUTPUT_DIR=/app/output/doc

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py app.css app.js index.html admin.html admin.js ./
COPY 模板.docx ./
COPY 自动表单工具说明.md 网页端使用说明.md 长期存储设计.md ./

RUN mkdir -p /app/data /app/output/doc

EXPOSE 8080

CMD ["python", "app.py"]

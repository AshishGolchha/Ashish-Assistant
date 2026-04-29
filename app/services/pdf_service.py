import os
import tempfile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def generate_chat_pdf(chat_id, messages):

    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, f"{chat_id}.pdf")

    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4

    y = height - 50
    c.setFont("Helvetica", 10)

    for msg in messages:

        text = f"{msg['sender'].upper()}: {msg['content']}"

        lines = [text[i:i+95] for i in range(0, len(text), 95)]

        for line in lines:
            c.drawString(40, y, line)
            y -= 15

            if y < 50:
                c.showPage()
                c.setFont("Helvetica", 10)
                y = height - 50

    c.save()

    return file_path
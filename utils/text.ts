/**
 * Chuyển đổi một chuỗi văn bản với cú pháp markdown đơn giản thành HTML.
 * Hỗ trợ in đậm (**text**), in nghiêng (*text*), và ngắt dòng.
 * @param text - Chuỗi đầu vào với markdown.
 * @returns - Chuỗi HTML đã được định dạng.
 */
export const parseSimpleMarkdown = (text: string): string => {
  if (!text) return '';
  let html = text;

  // IMPORTANT: Escape HTML cơ bản để tránh XSS nếu nội dung gốc chứa HTML.
  // Điều này ngăn chặn việc render các thẻ HTML không mong muốn từ dữ liệu đầu vào.
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Thứ tự rất quan trọng: đậm nghiêng -> đậm -> nghiêng
  // Đậm và Nghiêng: ***text*** hoặc ___text___
  html = html.replace(/\*\*\*(.+?)\*\*\*|___(.+?)___/g, '<strong><em>$1$2</em></strong>');
  
  // Đậm: **text** hoặc __text__
  html = html.replace(/\*\*(.+?)\*\*|__(.+?)__/g, '<strong>$1$2</strong>');

  // Nghiêng: *text* hoặc _text_
  html = html.replace(/\*(.+?)\*|_(.+?)_/g, '<em>$1$2</em>');

  // Ngắt dòng: chuyển đổi ký tự xuống dòng thành thẻ <br />
  html = html.replace(/\n/g, '<br />');

  return html;
};

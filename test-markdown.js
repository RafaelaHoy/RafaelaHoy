// Función para procesar Markdown a HTML
const processMarkdownToHTML = (markdown) => {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Underline
    .replace(/<u>(.+?)<\/u>/g, '<u>$1</u>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
    // Blockquotes
    .replace(/^> (.+$)/gim, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^- (.+$)/gim, '<ul><li>$1</li></ul>')
    // Ordered lists
    .replace(/^1\. (.+$)/gim, '<ol><li>$1</li></ol>')
    // Paragraphs (multiple lines)
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraphs
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h|<ul|<ol|<blockquote)/g, '$1')
    .replace(/(<\/h3>|<\/h4>|<\/ul>|<\/ol>|<\/blockquote>)<\/p>/g, '$1')
}

// Prueba
const testMarkdown = `Este es un párrafo de prueba.

**Este texto está en negrita**

*Este texto está en cursiva*

- Item 1 de lista
- Item 2 de lista

### Título 3

> Esto es una cita`

const result = processMarkdownToHTML(testMarkdown)
console.log('Markdown original:')
console.log(testMarkdown)
console.log('\nHTML procesado:')
console.log(result)

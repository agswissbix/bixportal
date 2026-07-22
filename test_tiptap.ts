import { Editor } from '@tiptap/core'; 
import { Markdown } from 'tiptap-markdown'; 
import { HardBreak } from '@tiptap/extension-hard-break'; 
import Document from '@tiptap/extension-document'; 
import Paragraph from '@tiptap/extension-paragraph'; 
import Text from '@tiptap/extension-text'; 

const CustomHardBreak = HardBreak.extend({ 
    addStorage() { 
        return { 
            markdown: { 
                serialize(state, node) { 
                    state.write('<br>\n'); 
                } 
            } 
        } 
    } 
}); 

const editor = new Editor({ 
    extensions: [Document, Paragraph, Text, CustomHardBreak, Markdown.configure({ html: true })], 
    content: '<p>test<br>test</p>' 
}); 

console.log('MD: ' + JSON.stringify(editor.storage.markdown.getMarkdown()));

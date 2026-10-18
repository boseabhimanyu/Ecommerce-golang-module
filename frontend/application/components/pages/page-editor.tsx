"use client";

import { Editor } from "@tinymce/tinymce-react";


type PageEditorProps = {
  initialContent: string;
  onChange: (content: string) => void;
};

export default function PageEditor({
  initialContent,
  onChange,
}: PageEditorProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/55 shadow-[0_12px_35px_rgba(31,38,135,0.06)] backdrop-blur-2xl">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl" 
        value={initialContent} 
        onEditorChange={(newContent) => {
          onChange(newContent);
        }}
        init={{
          height: 420,
          menubar: false,
          statusbar: false,
          plugins: [
            "lists",
            "link",
            "image",
            "autolink",
            "visualblocks",
            "wordcount",
            "code", // Will now correctly load from your public folder setup
          ],
          toolbar:
            "undo redo | " +
            "bold italic strikethrough forecolor backcolor | " +
            "h1 h2 h3 | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist | " +
            "blockquote | " +
            "image | code", // Added code to toolbar so you can actually click it!
          
          // ==========================================
          // TINYMCE SECURITY/FILTERING RULES
          // ==========================================
          valid_elements: 
            'p[class|style|align],br,' +
            'h1[class|style|align],h2[class|style|align],h3[class|style|align],' +
            'strong,em,s,span[class|style|color],ul,ol,li,blockquote,' +
            'hr,a[href|target|rel],img[src|alt|width|height|style|class]',
          
          invalid_elements: 'script,iframe,object,embed,form,input,button,textarea,select,svg,math',

          skin_url: "/tinymce/skins/ui/oxide",
          content_css: "/tinymce/skins/content/default/content.min.css",
          content_style: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #18181b;
              padding: 12px;
              background-color: transparent;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 1rem;
              margin: 1rem 0;
              object-fit: contain;
            }
          `,
          image_protocols: ["https"], // Strict https matching your backend policy
          image_dimensions: false,
          image_description: true,
          image_title: true,
        }}
      />
    </div>
  );
}
"use client";

import dynamic from "next/dynamic";

const BlogEditor = dynamic(() => import("./blog-editor-inner"), {
  ssr: false,
});

export default BlogEditor;
with open('C:/Users/user/Desktop/Coding/New folder/CloudTok/frontend/live.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the streamChatArea div and add chat bar before it
old = '<div class="streamChatArea" id="streamChatArea"></div>'
new = '''<div class="streamChatArea" id="streamChatArea"></div>
    <div class="streamInputBar" id="streamInputBar">
        <button class="emojiToggleBtn" id="liveEmojiToggle" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:18px;cursor:pointer;padding:6px;">😊</button>
        <button class="gifToggleBtn" id="liveGifToggle" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:14px;font-weight:600;cursor:pointer;padding:6px;">GIF</button>
        <button class="stickerToggleBtn" id="liveStickerToggle" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:14px;font-weight:600;cursor:pointer;padding:6px;">😀</button>
        <input id="liveMessageInput" type="text" placeholder="Chat...">
        <button id="liveSendBtn" style="background:#fe2c55;border:none;color:#fff;padding:8px 16px;border-radius:16px;font-weight:700;cursor:pointer;">Send</button>
        <div class="emojiBar" id="liveEmojiBar">
            <div class="emojiRow" id="liveEmojiRow"></div>
        </div>
        <div class="gifPanel" id="liveGifPanel">
            <div class="gifGrid" id="liveGifGrid"></div>
        </div>
        <div class="stickerPanel" id="liveStickerPanel">
            <div class="stickerGrid" id="liveStickerGrid"></div>
        </div>
    </div>'''

if old in content:
    content = content.replace(old, new)
    print("Chat bar added successfully")
else:
    print("ERROR: Could not find streamChatArea div")
    exit(1)

with open('C:/Users/user/Desktop/Coding/New folder/CloudTok/frontend/live.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("live.html updated. New length:", len(content))

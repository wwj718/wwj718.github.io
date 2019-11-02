'''
cd /Users/wuwenjie/just4funhugo/quickstart/content/post
ack -ho "http:[^\(\)\[\]]*?\.(png|jpg|jpeg|gif)" > /tmp/just4fun_img_list.txt
取得图片列表保存下来


ack -ho "http:[^\(\)\[\]]*?\.(PNG|JPG|JPEG)" > /tmp/big_just4fun_img_list.txt

# 所有mp4
ack -ho "http://.*?.(mp4|MP4)" > /tmp/blog_mp4_list.txt
'''

import subprocess
# with open("/tmp/just4fun_img_list.txt") as png_url_list:
with open("/tmp//tmp/blog_mp4_list.txt") as png_url_list:
    urls = set(png_url_list.readlines()) # 去重
    # print(len(urls))
for url in urls: 
    if "just4fun" in url:
        cmd = f"wget {url}"
        # print(url)
        subprocess.call(cmd,shell=True) # error timeout
    else:
        print(url)
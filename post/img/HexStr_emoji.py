from PIL import Image,ImageDraw,ImageFont

def mono_bmp_matrix(image,color_reverse=True,byte_reverse=False):
    width = image.size[0]
    height = image.size[1]
    
    heightRoundUp = (height+7)//8
    matrix = list()
    for h in range(0, heightRoundUp):
        for w in range(0, width):
            v = 0x00
            rs = 8*h
            re = 8*(h+1)
            for b in range(rs, re):
                if b >= height:
                    v |= (0x01 << b%8)
                else:
                    if image.getpixel((w, b)) != 0:
                        if not byte_reverse:
                            v |= (0x01 << b%8)
                        else:
                            v |= (0x01 << (7-b%8))
            if color_reverse:
                v ^= 0xff
            matrix.append(v)
    return matrix

def save_matrix(matrix,txtfile='untitle.txt',mode='w'):
    with open(txtfile,mode) as f:
        for i,v in enumerate(matrix):
            hexstr=f'{v:>02X}'
            f.write(hexstr)
            print('0x'+hexstr,end=',')
            if (i+1)%16==0:
                print()
        if len(matrix)%16 != 0:
            print()
        if mode=='a':
            f.write('\n')
            
def bmpHexString(bmpfile):
    img = Image.open(bmpfile)
    #判断BMP图像是否为单色，否则转化为单色
    if img.mode != '1':
        img = img.convert('L')
        img = img.convert('1')
    matrix = mono_bmp_matrix(img)
    img.close()
    save_matrix(matrix,bmpfile[:-4]+'.txt')
    
def charHexString(word,char_height=16,char_width=16):
    fn=word+'.txt'
    open(fn,'w')
    for s in word:
        print(f'/* {s} */')
        if ord(s) < 128:
            w = char_height//2
        else:
            w = char_width
        h = char_height
        img = Image.new("1", (w,h), (1))
        #ttfont = ImageFont.truetype("fonts/unifont-13.0.06.ttf", h)
        #simsun.ttc是宋体、新宋体、宋体-PUA 三种字体的集合，
        #可以通过在truetype中增加index参量实现对集合内字体的调用
        # ttfont = ImageFont.truetype("/tmp/seguiemj.ttf", h, index=1)
        # 下载地址 https://github.com/longan-link/dotpack_pyclient/blob/main/dotpack/src/seguiemj.ttf
        font_path = "/tmp/seguiemj.ttf"
        ttfont = ImageFont.truetype(font_path, h, layout_engine=ImageFont.LAYOUT_RAQM)

        draw = ImageDraw.Draw(img)
        draw.text((0,-1), u'%c' % s, (0), font=ttfont)
#         with open(fn,'a') as f:
#             f.write(f'/* {s} */\n')
        matrix = mono_bmp_matrix(img)
        save_matrix(matrix,fn,'a')
        #img.show()
        print()
        print(f"适用于 MicroBlocks OLED 汉字库的16进制字符串已保存在当前目录的 '{word}.txt' 文件里")
        img.close()
        

# bmpHexString('ble.bmp')
charHexString('🍇🍎',12,12)

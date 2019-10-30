#!/usr/bin/env python3
#
# Pelican to Hugo v20180603
#
# Convert Markdown files using the pseudo YAML frontmatter syntax
# from Pelican to files using the strict YAML frontmatter syntax
# that Hugo and other static engines expect.
#
# Anthony Nelzin-Santos
# https://anthony.nelzin.fr
# anthony@nelzin.fr
#
# European Union Public Licence v1.2
# https://joinup.ec.europa.eu/collection/eupl/eupl-text-11-12

# ref https://github.com/anthonynelzin/pelican-to-hugo/blob/master/pelican-to-hugo.py

# import os, os.path
import re
import pathlib  # https://docs.python.org/3/library/pathlib.html

#  Add the path to your files below
path = '/Users/wuwenjie/just4funhugo/quickstart/content'
# files = os.listdir(path)
from pathlib import Path

p = Path(path)
files = list(p.glob('**/*.md'))


def replace1():
    for file_p in files:
        # print(file_p)
        content = file_p.read_text()
        # print(content[:100])
        # break
        # 判断文件是否符合预期
        '''
	Date: 2019-06-23
	'''
        # pattern = r'(Date: \d{4}-\d{2}-\d{2})'
        pattern = r'^Date:'
        if re.match(pattern, content):
            # 合格文件，要发表
            # 调整好再一次写入
            print(file_p)
            content = re.sub(r'([Dd]ate:)', r'---\n\1', content)
            # Add closing frontmatter delimiter after the tags.
            # content = re.sub(r'(tags: .*)$$', r'\1\n---', content)
            # Enclose the title in quotes.
            content = re.sub(r'[tT]itle: (.*)', r'title: "\1"', content)
            # Change date formatting.
            content = re.sub(r'([Dd]ate: \d{4}-\d{2}-\d{2}) (\d{2}:\d{2})',
                             r'\1T\2:00Z', content)
            # tags，之前大部分是单标签
            content = re.sub(r'[tT]ags: (.*)', r'tags: ["\1"]\n---', content)
            # print(content[:100])
            # break
            file_p.write_text(content)

        else:
            print(file_p)
            if "---" not in content[:10]:
                # 不处理迁移后的文件
                if "draft: true" not in content:  # 幂等操作
                    # 其他的文件，不准备发表
                    draft_flag = '''
---
draft: true
---

	'''
                    content = draft_flag + content
                    file_p.write_text(content)


def replace2():
    '''
    add categories
    '''
    for file_p in files:
        # print(file_p)
        # import IPython;IPython.embed()
        content = file_p.read_text()
        pattern = r'^---' # 有效文章
        if re.match(pattern, content) and ("draft: true" not in content):
            category = file_p.parts[7]
            print(category)
            content = re.sub(r'([tT]ags:.*)', rf'\1\ncategories: ["{category}"]', content)
            # print(content[:100])
            # break
            file_p.write_text(content)

replace2()

'''
	file_name, file_extension = os.path.splitext(file)
	# Input files will be left in place,
	# output files will be suffixed with "_hugo".
	regexed_file = file_name + '_hugo' + file_extension

	# Only convert visible Markdown files.
	# This precaution is useless… until it is useful,
	# mainly on .DS_Store-ridden macOS folders.
	if not file_name.startswith('.') and file_extension in ('.md') : 
		input_file = os.path.join(path, file)
		output_file = os.path.join(path, regexed_file)

		# The files will be edited line by line using regex.
		# The conversion of a thousand files only takes a few seconds.
		with open(input_file, 'rU') as fi, open(output_file, 'w') as fo:
			for line in fi:
				# Add opening frontmatter delimiter before the title.
				line = re.sub(r'(title:)', r'---\n\1', line)
				# Add closing frontmatter delimiter after the tags.
				line = re.sub(r'(tags: .*)$$', r'\1\n---', line)
				# Enclose the title in quotes.
				line = re.sub(r'title: (.*)', r'title: "\1"', line)
				# Change date formatting.
				line = re.sub(r'(date: \d{4}-\d{2}-\d{2}) (\d{2}:\d{2})', r'\1T\2:00Z', line)
				# Slow but insightful way to edit the tags.
				if re.match(r'tags: (.*)', line):
					# Split the comma separated list of tags.
					tag_split = re.sub(r'(.*)', r'\1', line).split(', ')
					# Output the new list of tags.
					tag_plist = '\n- '.join(tag_split)
					# Insert a newline before the list.
					tag_list = re.sub(r'tags: (.*)', r'tags: \n- \1', tag_plist)
					# And enclose the tags in quotes.
					line = re.sub(r'- (.*)', r'- "\1"', tag_list)
				fo.write(line)
			# Print a little something about the conversion.
			print(file_name + ' converted.')
		'''
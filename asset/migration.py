import sys;
import string

input_css = open("/var/www/me-milkcocoa-info/css/style.css", "r")
output_css = open("/var/www/me-milkcocoa-info/css/style.migrated.css", "w")

input_html = open("/var/www/me-milkcocoa-info/index_base.html", "r")
output_html = open("/var/www/me-milkcocoa-info/index.html", "w")


css = input_css.read().translate(str.maketrans('', '', '\t\n'))
output_css.write(css)

html = input_html.read().translate(str.maketrans('', '', '\t'))
output_html.write(html)



input_css.close()
output_css.close()

input_html.close()
output_html.close()

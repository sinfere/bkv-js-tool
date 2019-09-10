FROM di.sinfere.com/sinfere/nginx:1.17.1

LABEL MAINTAINER="dd@sinfere.com"

COPY app/ /opt/htdocs/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
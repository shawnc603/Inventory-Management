FROM nrm-p.tsafe.io:5000/baseimages/build/tsafe_ops-base_nodev8:2.4

ARG PKG

ENV PKG=$PKG

COPY run finish /etc/service/$PKG/

RUN chmod 755 /etc/service/$PKG/run && chmod 755 /etc/service/$PKG/finish

COPY src /opt/$PKG

COPY config.yaml ./


RUN wget --auth-no-challenge --user "shippable.resource" --password "sh1pping_C0nta1nerz" https://nrm-p.tsafe.io:8443/repository/raw-tsafe_ops/env/npmrc -O /root/.npmrc && npm install --no-cache --unsafe-perm --prefix=/opt/$PKG /opt/$PKG

# Environment variables will override the defaults
# To change any of these values set them at the docker run command:
    # docker run --env <key>=<value>
# ENV 

# Set the api port to a unique value from any other service. The 13000 range is preferred with 10 port differences
# Remember, this port is internal and if exposed to the public will be remapped to 443 for https processing
# If using an environment variable API_PORT, parameter -p, or a config file to change the port to something other than
# then ensure that this is the same port number. If you decide to expose a range ex: 13000:13999 as a catch all,
# the current version of docker will create significant overhead per port and is not advised.
EXPOSE 13000

# any command line flags will override the environment variables and defaults
ENTRYPOINT ["/sbin/my_init"]

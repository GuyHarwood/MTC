FROM ruby:2.4.0

COPY ./install-freetds.sh .
RUN ./install-freetds.sh

# throw errors if Gemfile has been modified since Gemfile.lock
RUN bundle config --global frozen 1

# Update the repositories

# Debian Jessie mirrors have been removed
RUN echo "deb http://archive.debian.org/debian jessie-backports main" > /etc/apt/sources.list.d/jessie-backports.list
RUN sed -i '/deb http:\/\/deb.debian.org\/debian jessie-updates main/d' /etc/apt/sources.list
RUN set -eux; \
        # Jessie's apt doesn't support [check-valid-until=no] so we have to use this instead
        apt-get -o Acquire::Check-Valid-Until=false update;

# Install utilities
# Install XVFB and TinyWM
# Install fonts
# Install Python
RUN apt-get -yqq install curl unzip && \
    apt-get -yqq install xvfb tinywm && \
    apt-get -yqq install fonts-ipafont-gothic xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic && \
    apt-get -yqq install python && \
    rm -rf /var/lib/apt/lists/*

# Install Supervisor
RUN curl -sS -o - https://bootstrap.pypa.io/ez_setup.py | python && \
    easy_install -q supervisor

# Install Chrome WebDriver
RUN CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` && \
    mkdir -p /opt/chromedriver-$CHROMEDRIVER_VERSION && \
    curl -sS -o /tmp/chromedriver_linux64.zip http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip && \
    unzip -qq /tmp/chromedriver_linux64.zip -d /opt/chromedriver-$CHROMEDRIVER_VERSION && \
    rm /tmp/chromedriver_linux64.zip && \
    chmod +x /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver && \
    ln -fs /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver /usr/local/bin/chromedriver

# Install Google Chrome
RUN curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list && \
    apt-get -o Acquire::Check-Valid-Until=false update && \
    apt-get -yqq install google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY . .

RUN chmod +x wait-admin-app.sh

RUN bundle install

CMD ./wait-admin-app.sh && bundle exec rake features

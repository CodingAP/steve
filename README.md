<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<br />
<div align="center">
    <h3 align="center">STEVE</h3>
    <p align="center">
        STEVE is a static webstie generator that is inspired by Jekyll
        <br />
        <strong>There is current no documentation, but there will be soon!</strong>
        <br />
        <br />
        <a href="https://github.com/CodingAP/steve/issues">Report Bug</a>
        ·
        <a href="https://github.com/CodingAP/steve/issues">Request Feature</a>
    </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project
This project was created to get into professional Github repos and how to publish code that anyone can use. This isn't meant to be a replacement of Jekyll as it has a more established set of tools, but I wanted to create a Github repository that has a more clean and professional look 

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* Node.js
* Uses Marked for Markdown to HTML conversion

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

You will need npm to run STEVE.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/CodingAP/steve.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Run the main file and it should be ready to go

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

The only thing that the code exposes is the STEVE class, which can be used as such:
```
const Steve = require('./src/steve');
Steve.compile('path/to/folder');
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the Apache License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Your Name - [@Coding_AP](https://twitter.com/Coding_AP)

Project Link: [https://github.com/CodingAP/steve](https://github.com/CodingAP/steve)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/CodingAP/steve.svg?style=for-the-badge
[contributors-url]: https://github.com/CodingAP/steve/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/CodingAP/steve.svg?style=for-the-badge
[forks-url]: https://github.com/CodingAP/steve/network/members
[stars-shield]: https://img.shields.io/github/stars/CodingAP/steve.svg?style=for-the-badge
[stars-url]: https://github.com/CodingAP/steve/stargazers
[issues-shield]: https://img.shields.io/github/issues/CodingAP/steve.svg?style=for-the-badge
[issues-url]: https://github.com/CodingAP/steve/issues
[license-shield]: https://img.shields.io/github/license/CodingAP/steve.svg?style=for-the-badge
[license-url]: https://github.com/CodingAP/steve/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/alex-prosser-a8524a221
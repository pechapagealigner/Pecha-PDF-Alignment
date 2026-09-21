// High-resolution SVG data URL matching the user's uploaded Pecha logo
export const PECHA_LOGO_DATA_URL =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
      <defs>
        <!-- Soft drop shadow for Tibetan calligraphy -->
        <filter id="tibetanShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.45" />
        </filter>
      </defs>

      <!-- Outer deep Tibetan maroon circle -->
      <circle cx="500" cy="500" r="500" fill="#70131E" />

      <!-- Outer white card enclosure with rounded corners -->
      <rect x="190" y="238" width="620" height="550" rx="64" ry="64" fill="#FFFFFF" />

      <!-- Outer maroon U-shaped groove (curves under the middle white band) -->
      <path
        d="M 258 336 L 258 710 A 32 32 0 0 0 290 742 L 710 742 A 32 32 0 0 0 742 710 L 742 336"
        fill="none"
        stroke="#70131E"
        stroke-width="32"
        stroke-linecap="butt"
        stroke-linejoin="round"
      />

      <!-- Inner maroon U-shaped groove (curves under the inner white band) -->
      <path
        d="M 342 336 L 342 624 A 32 32 0 0 0 374 656 L 626 656 A 32 32 0 0 0 658 624 L 658 336"
        fill="none"
        stroke="#70131E"
        stroke-width="32"
        stroke-linecap="butt"
        stroke-linejoin="round"
      />

      <!-- Central maroon chamber with rounded bottom corners -->
      <path
        d="M 410 336 L 410 550 A 36 36 0 0 0 446 586 L 554 586 A 36 36 0 0 0 590 550 L 590 336 Z"
        fill="#70131E"
      />

      <!-- Central Sacred Tibetan Calligraphy: "དཔེ་ཆ།" with calligraphic wave and sweeping tail flourish -->
      <g filter="url(#tibetanShadow)" fill="#FFFFFF">
        <!-- Dengbu top-left wave flourish over Da -->
        <path d="M 444 429 C 435 423 424 414 418 417 C 413 420 417 426 426 426 C 435 426 441 429 446 432 Z" />
        
        <!-- Letter ད (Da) -->
        <path d="M 436 432 L 468 432 C 471 432 472 442 467 448 C 460 454 448 457 450 466 C 452 474 461 476 468 473 L 469 478 C 459 482 445 479 444 465 C 443 453 457 448 462 443 C 465 440 463 437 460 437 L 436 437 Z" />

        <!-- Subjoined letter པ (Pa) -->
        <path d="M 448 444 L 454 444 L 454 472 L 464 472 L 464 444 L 470 444 L 470 477 L 448 477 Z" />

        <!-- Letter ཆ (Cha) with sweeping calligraphic right tail -->
        <path d="M 482 432 L 515 432 C 518 432 518 437 514 437 L 500 437 C 493 437 488 442 488 451 C 488 460 494 465 501 465 C 508 465 512 460 512 453 L 517 453 C 517 462 510 470 501 470 C 490 470 482 462 482 451 C 482 440 487 432 496 432 Z" />
        <path d="M 501 437 C 512 437 524 441 524 453 C 524 462 518 467 511 467 L 511 471 C 519 471 528 465 529 455 C 530 463 528 475 524 485 C 527 487 536 495 550 501 C 564 506 580 510 595 512 C 596 512 596 514 594 514 C 576 513 558 509 544 503 C 532 498 524 491 520 487 C 517 495 514 500 511 500 C 509 500 509 497 511 492 C 515 482 517 472 517 464 L 513 464 C 515 459 516 453 516 447 C 516 440 510 437 501 437 Z" />

        <!-- Tibetan Shad punctuation mark ། -->
        <path d="M 567 434 L 572 434 L 570 479 L 567 479 Z" />
      </g>
    </svg>`
  );

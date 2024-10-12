import { expect, it } from "vitest";
import TokenImage from "../../components/Image/TokenImage";
import { renderWithProvider, setupMockIntersectionObserver } from "../../testHelpers";

it("renders correctly", () => {
  setupMockIntersectionObserver();
  const { asFragment } = renderWithProvider(
    <TokenImage
      src="https://metalists.plexfinance.us/images/bsc/0x32d9F70F6eF86718A51021ad269522Abf4CFFE49.svg"
      height={48}
      width={48}
    />
  );
  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      .c0 {
      max-height: 48px;
      max-width: 48px;
      position: relative;
      width: 100%;
    }

    .c0:after {
      content: "";
      display: block;
      padding-top: 100%;
    }

    .c2 {
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }

    .c1 >img {
      border-radius: 50%;
    }

    .c1:before {
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.25);
      content: "";
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 7;
    }

    <div
        class="c0 c1"
      >
        <div
          class="c2"
        />
      </div>
    </DocumentFragment>
  `);
});
